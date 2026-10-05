'use strict';

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const { QueryTypes } = require("sequelize");
const moment = require('moment');
const staffAttendanceServices = require("../service/staff-attendance-service");

async function getAllEmployeeTrackingWithStatus(date) {
    try {
        if (!date) {
            throw new Error("Date parameter is required");
        }

        // Convert date to start and end timestamps
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime() - 1;
let attendanceDate={"attendanceDate":date};

        // Get all active staff members
        const allStaff = await sequelize.query(
            `SELECT 
                s.staff_id as "staffId", 
                s.staff_code as "staffCode", 
                CONCAT(s.first_name, ' ', s.last_name) as "staffName",
                s.branch_id as "branchId",
                b.branch_name as "branchName",
                d.department_id as "departmentId",
                d.department_name as "departmentName"
            FROM staffs s
            LEFT JOIN branches b ON s.branch_id = b.branch_id
            LEFT JOIN department d ON s.department_id = d.department_id
            WHERE s.is_active = 1 AND s.staff_id != 1
            ORDER BY s.staff_id`,
            { type: QueryTypes.SELECT }
        );

        if (allStaff.length === 0) {
            return [];
        }
 let staffdayAttenList= await staffAttendanceServices.getStaffAttendance(attendanceDate);
        // Process all staff in parallel
        const trackingPromises = allStaff.map(async (staff) => {
            try {
                // const getGeoLocations= await getGeoLocationsByDate(staff.staffId, date);
                const totalDistance= await getTotalDistance(staff.staffId, date);
                
                // Get time intervals for the date
                const timeIntervals = await getTimeIntervalsForStaff(staff.staffId, date);
                
                // Get the latest geolocation
                const latestGeoLocation = await getLatestGeoLocation(staff.staffId, date);
                
                // Get previous geolocation (for movement calculation)
                const previousGeoLocation = await getPreviousGeoLocation(staff.staffId, date, latestGeoLocation?.createdAt);
                
                // Determine movement status
                const movementStatus = calculateMovementStatus(latestGeoLocation, previousGeoLocation);

                // Mark as offline if the user has punched out
                if (isUserPunchedOut(timeIntervals) && latestGeoLocation) {
                  latestGeoLocation.actionType = 'offline';
                }

                const staffPresent = staffdayAttenList.filter(s => s.staffId == staff.staffId);
                const attendanceInfo = staffPresent.length > 0 ? staffPresent[0] : { attendanceStatus: 'absent', attendanceStatusId: 0 };
                // Get punch times
                const punchInTime = getPunchTime(timeIntervals, 'Punch In-Tracker');
                const punchOutTime = getPunchTime(timeIntervals, 'Punch Out-Tracker');
                
                // Get visit count
                const visitCount = getVisitCount(timeIntervals);
                
                // Format response
                return {
                    staffId: staff.staffId,
                    staffCode: staff.staffCode,
                    staffName: staff.staffName,
                    branchId: staff.branchId,
                    branchName: staff.branchName,
                    departmentId: staff.departmentId,
                    departmentName: staff.departmentName,
                    attendanceStatus: attendanceInfo.attendanceStatus,
                    attendanceStatusId: attendanceInfo.attendanceStatusId,
                    timeIntervals:timeIntervals,
                    attendanceDate: date,
                    totalDistance:totalDistance,
                    punchInTime: punchInTime,
                    punchOutTime: punchOutTime,
                    movementStatus: movementStatus.status,
                    movementStatusLabel: movementStatus.label,
                    lastUpdated: latestGeoLocation?.createdAt ? formatTimeFromTimestamp(latestGeoLocation.createdAt) : null,
                    lastLocation: latestGeoLocation ? {
                        latitude: latestGeoLocation.latitude,
                        longitude: latestGeoLocation.longitude,
                        address: latestGeoLocation.address
                    } : null,
                    visitCount: visitCount,
                    totalRecords: timeIntervals.length,
                    geoLocation: latestGeoLocation ? [formatGeoLocation(latestGeoLocation)] : []
                };
            } catch (error) {
                console.error(`Error processing staff ${staff.staffId}:`, error);
                // Return basic info if processing fails
                return {
                    staffId: staff.staffId,
                    staffCode: staff.staffCode,
                    staffName: staff.staffName,
                    branchId: staff.branchId,
                    branchName: staff.branchName,
                    departmentId: staff.departmentId,
                    departmentName: staff.departmentName,
                    attendanceDate: date,
                    punchInTime: null,
                    punchOutTime: null,
                    movementStatus: 'unknown',
                    movementStatusLabel: 'Unknown',
                    lastUpdated: null,
                    lastLocation: null,
                    visitCount: 0,
                    totalRecords: 0,
                    geoLocation: []
                };
            }
        });

        // Wait for all promises to resolve
        const trackingResults = await Promise.all(trackingPromises);
        
        // Filter out any null results
        return trackingResults.filter(result => result !== null);
        
    } catch (error) {
        console.error("Error in getAllEmployeeTrackingWithStatus:", error);
        throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
    }
}

function isUserPunchedOut(timeIntervals) {
  if (!timeIntervals || timeIntervals.length === 0) return false;
  for (let i = timeIntervals.length - 1; i >= 0; i--) {
    const ti = timeIntervals[i];
    if (ti.actionType === 'Punch Out-Tracker') return true;
    if (ti.actionType === 'Punch In-Tracker') return false;
  }
  return false;
}

async function getTimeIntervalsForStaff(staffId, date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime() - 1;

    const result = await sequelize.query(
        `SELECT 
            id,
            staff_id as "staffId",
            time_status as "timeStatus",
            attendance_mark_type as "attendanceMarkType",
            status,
            attendance_type as "attendanceType",
            image_name as "imageName",
            network_status as "networkStatus",
            battery,
            flight_mode as "flightMode",
            address,
            brand,
            manufacturer,
            board,
            device,
            display,
            hardware,
            model,
            product,
            updated_at as "updatedAt",
            latitude,
            longitude,
            coordinates,
            mongo_id as "mongoId",
            action_type as "actionType",
            record_created_at as "createdAt",
            coordinates_points as "coordinatesPoints",
            work_time as "workTime",
            total_work_time as "totalWorkTime",
            distance,
            speed,
            km_difference as "kmDifference",
            time_travelled as "timeTravelled",
            mobile_status as "mobileStatus",
            image_url as "imageUrl"
        FROM time_intervals 
        WHERE staff_id = ? 
        AND record_created_at BETWEEN ? AND ?
        ORDER BY record_created_at ASC`,
        {
            replacements: [staffId, startTimestamp, endTimestamp],
            type: QueryTypes.SELECT
        }
    );
if(staffId==3){
    console.log("helo")
}
    return result;
}

async function getLatestGeoLocation(staffId, date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime() - 1;

    const result = await sequelize.query(
        `SELECT 
            id,
            staff_id as "staffId",
            type,
            latitude,
            longitude,
            attendanceMarkType as "attendanceMarkType",
            attendanceType as "attendanceType",
            actionType as "actionType",
            status,
            permissionStatus,
            battery,
            networkStatus as "networkStatus",
            flightMode as "flightMode",
            speed,
            distance,
            kmDifference as "kmDifference",
            totalDistance as "totalDistance",
            coordinatesPoints as "coordinatesPoints",
            imageName as "imageName",
            imageUrl as "imageUrl",
            record_createdAt as "createdAt"
        FROM staff_geolocations 
        WHERE staff_id = ? 
        AND record_createdAt BETWEEN ? AND ?
        ORDER BY record_createdAt DESC 
        LIMIT 1`,
        {
            replacements: [staffId, startTimestamp, endTimestamp],
            type: QueryTypes.SELECT
        }
    );

    return result.length > 0 ? result[0] : null;
}

async function getTotalDistance(staffId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime() - 1;

  const result = await sequelize.query(
    `SELECT COALESCE(SUM(CAST(distance AS DECIMAL(10,2))), 0) as totalDistance
     FROM staff_geolocations 
     WHERE staff_id = ? 
       AND record_createdAt BETWEEN ? AND ?
       AND distance IS NOT NULL 
       AND distance != ''`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  return parseFloat(result[0].totalDistance) || 0;
}

async function getPreviousGeoLocation(staffId, date, currentTimestamp) {
    if (!currentTimestamp) return null;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime() - 1;

    const result = await sequelize.query(
        `SELECT 
            id,
            latitude,
            longitude,
            record_createdAt as "createdAt",
            distance,
            speed
        FROM staff_geolocations 
        WHERE staff_id = ? 
        AND record_createdAt BETWEEN ? AND ?
        AND record_createdAt < ?
        ORDER BY record_createdAt DESC 
        LIMIT 1`,
        {
            replacements: [staffId, startTimestamp, endTimestamp, currentTimestamp],
            type: QueryTypes.SELECT
        }
    );

    return result.length > 0 ? result[0] : null;
}

function calculateMovementStatus(currentLocation, previousLocation) {
    // If no current location, return not moving
    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
        return { status: 'not_moving', label: 'Not Moving' };
    }
    
    // If no previous location, we can't determine movement
    if (!previousLocation || !previousLocation.latitude || !previousLocation.longitude) {
        return { status: 'unknown', label: 'Unknown' };
    }
    
    // Calculate distance between current and previous location
    const distance = calculateDistance(
        parseFloat(currentLocation.latitude),
        parseFloat(currentLocation.longitude),
        parseFloat(previousLocation.latitude),
        parseFloat(previousLocation.longitude)
    );
    
    // Calculate time difference in minutes
    const currentTime = currentLocation.createdAt;
    const previousTime = previousLocation.createdAt;
    const timeDiffMinutes = (currentTime - previousTime) / (1000 * 60);
    
    // If time difference is more than 30 minutes, consider as unknown
    if (timeDiffMinutes > 30) {
        return { status: 'unknown', label: 'Unknown' };
    }
    
    // If distance is less than 0.01 km (10 meters) and time difference less than 5 minutes, consider as not moving
    if (distance < 0.01 && timeDiffMinutes < 5) {
        return { status: 'not_moving', label: 'Not Moving' };
    }
    
    // If distance is significant and time difference reasonable, consider as moving
    if (distance >= 0.01) {
        return { status: 'moving', label: 'Moving' };
    }
    
    return { status: 'not_moving', label: 'Not Moving' };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getPunchTime(timeIntervals, actionType) {
    if (!timeIntervals || timeIntervals.length === 0) return null;
    
    const punchRecord = timeIntervals.find(item => 
        item.actionType === actionType
    );
    
    if (!punchRecord || !punchRecord.createdAt) return null;
    
    return formatTimeFromTimestamp(punchRecord.createdAt);
}

function getVisitCount(timeIntervals) {
    if (!timeIntervals || timeIntervals.length === 0) return 0;
    
    return timeIntervals.filter(ti => ti.actionType === 'Visit In-Tracker').length;
}

function formatTimeFromTimestamp(timestamp) {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function formatGeoLocation(geoLocation) {
    return {
        id: { $oid: geoLocation.id.toString() },
        staffId: geoLocation.staffId,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
        coordinates: [parseFloat(geoLocation.longitude), parseFloat(geoLocation.latitude)],
        coordinatesPoints: geoLocation.coordinatesPoints || `${geoLocation.latitude},${geoLocation.longitude}`,
        mobileStatus: `${geoLocation.battery}%,${geoLocation.networkStatus}`,
        image: geoLocation.imageUrl,
        createdAt: geoLocation.createdAt,
        actionType: geoLocation.actionType,
        status: geoLocation.status
    };
}
async function getGeoLocationsByDate(staffId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime() - 1;

  const result = await sequelize.query(
    `SELECT 
      id,
      staff_id as "staffId",
      type,
      latitude,
      longitude,
      attendanceMarkType as "attendanceMarkType",
      attendanceType as "attendanceType",
      actionType as "actionType",
      status,
      permissionStatus,
      battery,
      networkStatus as "networkStatus",
      flightMode as "flightMode",
      speed,
      distance,
      kmDifference as "kmDifference",
      totalDistance as "totalDistance",
      coordinatesPoints as "coordinatesPoints",
      imageName as "imageName",
      imageUrl as "imageUrl",
      record_createdAt as "createdAt"
    FROM staff_geolocations 
    WHERE staff_id = ? 
      AND record_createdAt BETWEEN ? AND ?
    ORDER BY record_createdAt ASC`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  return result.map(item => ({
    ...item,
    id: { $oid: item.id.toString() },
    coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)],
    coordinatesPoints: item.coordinatesPoints || `${item.latitude},${item.longitude}`,
    mobileStatus: `${item.battery}%,${item.networkStatus}`,
    image: item.imageUrl
  }));
}

// Alternative function with MongoDB-like response format
async function getAllEmployeeTrackingMongoFormat(date) {
    try {
        const results = await getAllEmployeeTrackingWithStatus(date);
        
        return results.map(item => ({
            count: {
                clientVisitCount: item.visitCount,
                config: item.totalRecords
            },
            records: {
                employeeId: item.staffId,
                subDomain: "K3_W300",
                empCode: item.staffCode,
                empName: item.staffName,
                geoLocation: item.geoLocation,
                timeInterval: item.timeInterval, // You can add time intervals here if needed
                totalDistance: item.totalDistance, // You can calculate this if needed
                attendanceDate: formatAttendanceDate(item.attendanceDate),
                shiftWithException: "GS(07:00 - 19:00)",
                movementStatus: item.movementStatus,
                movementStatusLabel: item.movementStatusLabel,
                attendanceStatusId:item.attendanceStatusId,
                attendanceStatus:item.attendanceStatus,
                punchInTime: item.punchInTime,
                punchOutTime: item.punchOutTime,
                visitCount: item.visitCount,
                branchName: item.branchName,
                departmentName: item.departmentName,
                id: `staff_${item.staffId}_${item.attendanceDate.replace(/-/g, '')}`,
                _id: `staff_${item.staffId}_${item.attendanceDate.replace(/-/g, '')}`
            }
        }));
    } catch (error) {
        throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
    }
}

function formatAttendanceDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options).replace(/\s/g, '-');
}

async function getStaffAttendanceList(query) {
  try {
    if (!query.attendanceDate) {
      throw new Error("attendanceDate is required");
    }

    const filters = [];
    
    if (query.branchId && query.branchId !== 'null') {
      if (query.branchId.includes(',')) {
        const branchIds = query.branchId
          .split(',')
          .map(id => id.trim())
          .filter(id => id !== '');
        
        if (branchIds.length > 0) {
          const orConditions = branchIds.map(id => `s.branch_id = ${id}`).join(' OR ');
          filters.push(`(${orConditions})`);
        }
      } else {
        filters.push(`s.branch_id = ${query.branchId}`);
      }
    }
    
    if (query.staffId) {
      filters.push(`s.staff_id = ${query.staffId}`);
    }
    
    filters.push(`s.staff_id != 1 AND s.is_active = 1`);
    
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    
    const startDate = moment(query.attendanceDate).startOf("month").format("YYYY-MM-DD");
    const endDate = moment(query.attendanceDate).endOf("month").format("YYYY-MM-DD");

    // Get all active staff based on filters
    const staffQuery = `
      SELECT 
        staff_id AS staffId,
        s.staff_profile_image_name AS staffProfile,
        s.staff_code AS staffCode,
        CONCAT(first_name, ' ', last_name) AS staffName
      FROM staffs s
      ${whereClause}
    `;

    const allStaff = await sequelize.query(staffQuery, {
      type: QueryTypes.SELECT,
      raw: true,
    });

    // Get all dates in the month
    const allDates = [];
    let currentDate = moment(startDate);
    while (currentDate.isSameOrBefore(endDate, "day")) {
      allDates.push(currentDate.format("YYYY-MM-DD"));
      currentDate.add(1, "day");
    }

    // Fetch attendance records for the month
    const attendanceRecords = await sequelize.query(
      `SELECT 
        sa.staff_attendance_id AS attendanceId,
        sa.staff_id AS staffId,
        sa.attendance_status_id AS attendanceStatusId,
        sa.attendance_date AS attendanceDate
       FROM staff_attendances sa
       WHERE sa.attendance_date BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY sa.attendance_date ASC`,
      { type: QueryTypes.SELECT, raw: true }
    );

    // Fetch holidays for the month
    const holidays = await sequelize.query(
      `SELECT holiday_date FROM holidays 
       WHERE holiday_date BETWEEN '${startDate}' AND '${endDate}'`,
      { type: QueryTypes.SELECT, raw: true }
    );

    const holidayDatesSet = new Set(holidays.map(h => moment(h.holiday_date).format('YYYY-MM-DD')));
    
    let attendanceDetail = [];

    // Process each staff member
    for (const staff of allStaff) {
      const filteredAttendanceRecords = attendanceRecords.filter(
        (att) => att.staffId === staff.staffId
      );

      let staffAttendance = {
        staffId: staff.staffId,
        staffCode: staff.staffCode,
        staffProfile: staff.staffProfile,
        staffName: staff.staffName,
        totalWorkingDays: 0,
        presentCount: 0,
        absentCount: 0,
        halfDayCount: 0,
        dailyStatus: {},
        dailyDistance: {} // New field to store distance for each date
      };

      // Process each date in the month
      for (const date of allDates) {
        const dayOfWeek = moment(date).day(); // 0 = Sunday
        
        if (dayOfWeek === 0) {
          staffAttendance.dailyStatus[date] = "sunday";
          staffAttendance.dailyDistance[date] = 0;
          continue;
        }
        
        if (holidayDatesSet.has(date)) {
          staffAttendance.dailyStatus[date] = "holiday";
          staffAttendance.dailyDistance[date] = 0;
          continue;
        }

        const record = filteredAttendanceRecords.find(
          (att) => moment(att.attendanceDate).format("YYYY-MM-DD") === date
        );

        // Get total distance for this staff on this date
        let totalDistance = 0;
        try {
          const distanceResult = await getTotalDistance(staff.staffId, date);
          totalDistance = distanceResult;
        } catch (error) {
          console.error(`Error fetching distance for staff ${staff.staffId} on ${date}:`, error);
          totalDistance = 0;
        }

        staffAttendance.dailyDistance[date] = totalDistance;

        if (record) {
          switch (record.attendanceStatusId) {
            case 1:
              staffAttendance.dailyStatus[date] = "present";
              staffAttendance.presentCount++;
              break;
            case 2:
              staffAttendance.dailyStatus[date] = "halfday";
              staffAttendance.halfDayCount++;
              break;
            default:
              staffAttendance.dailyStatus[date] = "absent";
              staffAttendance.absentCount++;
              break;
          }
          staffAttendance.totalWorkingDays++;
        } else {
          staffAttendance.dailyStatus[date] = "-"; // No data, not a holiday or Sunday
        }
      }

      // Calculate total distance for the month
      const totalMonthDistance = Object.values(staffAttendance.dailyDistance).reduce(
        (sum, distance) => sum + distance, 0
      );
      
      staffAttendance.totalMonthDistance = parseFloat(totalMonthDistance.toFixed(2));
      
      attendanceDetail.push(staffAttendance);
    }

    return {
      attendanceDetail,
      dateRange: {
        startDate,
        endDate,
        totalDates: allDates.length
      }
    };
    
  } catch (error) {
    console.error("Error fetching staff attendance report:", error);
    throw new Error(error.message || "Operation error");
  }
}

module.exports = {
    getAllEmployeeTrackingWithStatus,
    getAllEmployeeTrackingMongoFormat,
    getTimeIntervalsForStaff,
    getLatestGeoLocation,
    getPreviousGeoLocation,
    calculateMovementStatus,
    getPunchTime,
    getVisitCount,
    getStaffAttendanceList
};