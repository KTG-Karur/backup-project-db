'use strict';
const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");

async function getEmployeeTracking(query) {
  try {
    const { staffId, date } = query;
    
    // Get staff basic information
    const staffInfo = await sequelize.query(
      `SELECT 
        staff_id as "staffId",
        staff_code as "staffCode", 
        CONCAT(first_name, ' ', last_name) as "staffName"
       FROM staffs 
       WHERE staff_id = ?`,
      {
        replacements: [staffId],
        type: QueryTypes.SELECT
      }
    );

    if (staffInfo.length === 0) {
      throw new Error("Staff not found");
    }

    const staff = staffInfo[0];

    // Get time intervals for the date
    const timeIntervals = await getTimeIntervalsByDate(staffId, date);
    
    // Get geo locations for the date
    const geoLocations = await getGeoLocationsByDate(staffId, date);
    
    // Calculate total distance
    const totalDistance = await getTotalDistance(staffId, date);
    // Get counts
    const counts = await getCounts(staffId, date);

    // Mark as offline if the user has punched out
    if (isUserPunchedOut(timeIntervals) && geoLocations.length > 0) {
      geoLocations[geoLocations.length - 1].actionType = 'offline';
    }
    

    return {
      count: counts,
      records: {
        employeeId: staff.staffId,
        subDomain: "K3_W300",
        empCode: staff.staffCode,
        empName: staff.staffName,
        geoLocation: geoLocations,
        timeInterval: timeIntervals,
        totalDistance: totalDistance,
        attendanceDate: formatDate(date),
        shiftWithException: "GS(07:00 - 19:00)",
        id: `staff_${staffId}_${date.replace(/-/g, '')}`,
        _id: `staff_${staffId}_${date.replace(/-/g, '')}`
      }
    };
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}
async function getGeoLocationsByDate(staffId, date, endDate) {
  const startDate = new Date(date);
  const rangeEnd = endDate ? new Date(endDate) : new Date(date);
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  
  const startTimestamp = startDate.getTime();
  const endTimestamp = rangeEnd.getTime() - 1;

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

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options).replace(/\s/g, '-');
}

/**
 * Check if a user has punched out based on their time intervals.
 * Returns true if the latest action_type is 'Punch Out-Tracker'.
 */
function isUserPunchedOut(timeIntervals) {
  if (!timeIntervals || timeIntervals.length === 0) return false;
  for (let i = timeIntervals.length - 1; i >= 0; i--) {
    const ti = timeIntervals[i];
    if (ti.actionType === 'Punch Out-Tracker') return true;
    if (ti.actionType === 'Punch In-Tracker') return false;
  }
  return false;
}

async function getTimeIntervalsByDate(staffId, date) {
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

  return result.map(item => ({
    ...item,
    id: { $oid: item.id.toString() },
    coordinates: item.coordinates || [parseFloat(item.longitude), parseFloat(item.latitude)],
    image: item.imageUrl,
    mobileStatus: item.mobileStatus || `${item.battery}%,${item.networkStatus}`
  }));
}

async function getCounts(staffId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime() - 1;

  const clientVisitCount = await sequelize.query(
    `SELECT COUNT(*) as count 
     FROM time_intervals 
     WHERE staff_id = ? 
       AND record_created_at BETWEEN ? AND ?
       AND action_type = 'Visit In-Tracker'`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  const timeIntervalCount = await sequelize.query(
    `SELECT COUNT(*) as count 
     FROM time_intervals 
     WHERE staff_id = ? 
       AND record_created_at BETWEEN ? AND ?`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  const geoLocationCount = await sequelize.query(
    `SELECT COUNT(*) as count 
     FROM staff_geolocations 
     WHERE staff_id = ? 
       AND record_createdAt BETWEEN ? AND ?`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  return {
    clientVisitCount: parseInt(clientVisitCount[0].count) || 0,
    config: parseInt(timeIntervalCount[0].count) + parseInt(geoLocationCount[0].count) || 0
  };
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



async function getAllEmployeeTracking(date) {
  try {
    // Get all active staff members
    const allStaff = await sequelize.query(
      `SELECT staff_id as "staffId", staff_code as "staffCode", 
       CONCAT(first_name, ' ', last_name) as "staffName" 
       FROM staffs 
       WHERE is_active = 1`,
      { type: QueryTypes.SELECT }
    );

    if (allStaff.length === 0) {
      return [];
    }

    const results = [];
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime() - 1;

    // Process all staff in parallel
    const trackingPromises = allStaff.map(async (staff) => {
      try {
        // Get time intervals for the date
        const timeIntervals = await getTimeIntervalsByDate(staff.staffId, date);
        
        // Get the last geolocation for the date
        const lastGeoLocation = await getLastGeoLocationByDate(staff.staffId, date);
        
        // Get total distance
        const totalDistance = await getTotalDistance(staff.staffId, date);
        
        // Get counts
        const counts = await getCounts(staff.staffId, date);

        // Mark as offline if the user has punched out
        if (isUserPunchedOut(timeIntervals) && lastGeoLocation) {
          lastGeoLocation.actionType = 'offline';
        }
        
        // Format response similar to getEmployeeTracking but with single geolocation
        return {
          count: counts,
          records: {
            employeeId: staff.staffId,
            subDomain: "K3_W300",
            empCode: staff.staffCode,
            empName: staff.staffName,
            geoLocation: lastGeoLocation ? [lastGeoLocation] : [], // Single location in array
            timeInterval: timeIntervals,
            totalDistance: totalDistance,
            attendanceDate: formatDate(date),
            shiftWithException: "GS(07:00 - 19:00)",
            id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`,
            _id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`
          }
        };
      } catch (error) {
        console.error(`Error processing staff ${staff.staffId}:`, error);
        // Return basic info even if tracking data fails
        return {
          count: { clientVisitCount: 0, config: 0 },
          records: {
            employeeId: staff.staffId,
            subDomain: "K3_W300",
            empCode: staff.staffCode,
            empName: staff.staffName,
            geoLocation: [],
            timeInterval: [],
            totalDistance: 0,
            attendanceDate: formatDate(date),
            shiftWithException: "GS(07:00 - 19:00)",
            id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`,
            _id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`
          }
        };
      }
    });

    // Wait for all promises to resolve
    const trackingResults = await Promise.all(trackingPromises);
    
    // Filter out any null results and return
    return trackingResults.filter(result => result.records.geoLocation.length !== 0);

  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function getLastGeoLocationByDate(staffId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime() - 1;

  const result = await sequelize.query(
    `SELECT id, staff_id as "staffId", type, latitude, longitude, 
     attendanceMarkType as "attendanceMarkType", attendanceType as "attendanceType", 
     actionType as "actionType", status, permissionStatus, battery, 
     networkStatus as "networkStatus", flightMode as "flightMode", speed, 
     distance, kmDifference as "kmDifference", totalDistance as "totalDistance", 
     coordinatesPoints as "coordinatesPoints", imageName as "imageName", 
     imageUrl as "imageUrl", record_createdAt as "createdAt"
     FROM staff_geolocations 
     WHERE staff_id = ? AND record_createdAt BETWEEN ? AND ? 
     ORDER BY record_createdAt DESC 
     LIMIT 1`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  if (result.length === 0) {
    return null;
  }

  const item = result[0];
  return {
    ...item,
    id: { $oid: item.id.toString() },
    coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)],
    coordinatesPoints: item.coordinatesPoints || `${item.latitude},${item.longitude}`,
    mobileStatus: `${item.battery}%,${item.networkStatus}`,
    image: item.imageUrl
  };
}

async function getProductivityHistory(staffId, date, fromDate, toDate) {
  try {
    const rangeLabel = date ? `date: ${date}` : `from: ${fromDate} to: ${toDate}`;
    console.log(`Getting productivity history for staffId: ${staffId}, ${rangeLabel}`);

    const geoLocations = date
      ? await getGeoLocationsByDate(staffId, date)
      : await getGeoLocationsByDate(staffId, fromDate, toDate);
    
    console.log(`Total geolocations fetched: ${geoLocations.length}`);
    
    if (geoLocations.length === 0) {
      console.log('No geolocations found');
      return {
        count: {
          all: 0,
          moving: 0,
          notMoving: 0,
          meeting: 0,
          offline: 0,
          similarity: 0
        },
        overview: {
          totalKMMoved: 0,
          totalTimeMoving: "00:00",
          totalTimeNotMoving: "00:00",
          totalTimeMeeting: "00:00",
          totalTimeTracked: "00:00",
          averageSpeed: "0.00",
          efficiencyScore: 0
        },
        productivityHistory: []
      };
    }

    // Log first few records to check structure
    console.log('First 3 geolocation records:');
    geoLocations.slice(0, 3).forEach((loc, index) => {
      console.log(`Record ${index + 1}:`, {
        id: loc.id,
        createdAt: loc.createdAt,
        latitude: loc.latitude,
        longitude: loc.longitude,
        distance: loc.distance,
        type: typeof loc.createdAt
      });
    });

    // Analyze movement patterns
    const productivityHistory = await analyzeMovementPatterns(geoLocations, staffId, date);
    
    console.log(`Productivity history segments created: ${productivityHistory.length}`);
    
    if (productivityHistory.length > 0) {
      console.log('First productivity segment:', productivityHistory[0]);
    }
    
    // Calculate counts
    const counts = calculateProductivityCounts(productivityHistory);
    
    // Calculate overview metrics
    const overview = calculateOverviewMetrics(productivityHistory, geoLocations);
    
    console.log('Final counts:', counts);
    console.log('Overview metrics:', overview);

    return {
      count: counts,
      overview: overview,
      productivityHistory: productivityHistory
    };
  } catch (error) {
    console.error('Error in getProductivityHistory:', error);
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}
function calculateOverviewMetrics(productivityHistory, geoLocations) {
  // Initialize metrics
  let totalMovingTime = 0; // in milliseconds
  let totalNotMovingTime = 0;
  let totalMeetingTime = 0;
  let totalDistance = 0;
  
  // Calculate times from productivity history segments
  productivityHistory.forEach(segment => {
    const duration = segment.endTime - segment.startTime;
    
    switch(segment.type) {
      case 0: // Moving
        totalMovingTime += duration;
        break;
      case 1: // Not Moving
        totalNotMovingTime += duration;
        break;
      case 2: // Meeting
        totalMeetingTime += duration;
        break;
    }
  });
  
  // Calculate total distance from geolocations
  if (geoLocations.length > 1) {
    // Sort by timestamp
    const sortedLocations = geoLocations.sort((a, b) => {
      const timeA = typeof a.createdAt === 'string' ? parseInt(a.createdAt) : a.createdAt;
      const timeB = typeof b.createdAt === 'string' ? parseInt(b.createdAt) : b.createdAt;
      return timeA - timeB;
    });
    
    // Sum all distances from the distance field if available
    const distanceFromField = sortedLocations.reduce((sum, loc) => {
      if (loc.distance && !isNaN(parseFloat(loc.distance))) {
        return sum + parseFloat(loc.distance);
      }
      return sum;
    }, 0);
    
    // Also calculate distance from coordinates for accuracy
    let calculatedDistance = 0;
    for (let i = 0; i < sortedLocations.length - 1; i++) {
      const current = sortedLocations[i];
      const next = sortedLocations[i + 1];
      
      const lat1 = parseFloat(current.latitude);
      const lon1 = parseFloat(current.longitude);
      const lat2 = parseFloat(next.latitude);
      const lon2 = parseFloat(next.longitude);
      
      if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
        calculatedDistance += calculateDistance(lat1, lon1, lat2, lon2);
      }
    }
    
    // Use the larger of the two distance calculations
    totalDistance = Math.max(distanceFromField, calculatedDistance);
  }
  
  // Calculate total tracked time (sum of all segments)
  const totalTrackedTime = totalMovingTime + totalNotMovingTime + totalMeetingTime;
  
  // Calculate average speed (km/h)
  const totalMovingHours = totalMovingTime / (1000 * 60 * 60);
  const averageSpeed = totalMovingHours > 0 ? totalDistance / totalMovingHours : 0;
  
  // Calculate efficiency score (percentage of time moving)
  const efficiencyScore = totalTrackedTime > 0 ? 
    Math.round((totalMovingTime / totalTrackedTime) * 100) : 0;
  
  // Format times to HH:MM
  const formatTime = (milliseconds) => {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  return {
    totalKMMoved: parseFloat(totalDistance.toFixed(2)),
    totalTimeMoving: formatTime(totalMovingTime),
    totalTimeNotMoving: formatTime(totalNotMovingTime),
    totalTimeMeeting: formatTime(totalMeetingTime),
    totalTimeTracked: formatTime(totalTrackedTime),
    averageSpeed: averageSpeed.toFixed(2),
    efficiencyScore: efficiencyScore,
    // Additional metrics
    numberOfStops: productivityHistory.filter(s => s.type === 1).length,
    averageStopDuration: formatTime(totalNotMovingTime / Math.max(1, productivityHistory.filter(s => s.type === 1).length)),
    distancePerHour: totalDistance > 0 ? (totalDistance / (totalTrackedTime / (1000 * 60 * 60))).toFixed(2) : "0.00"
  };
}

async function analyzeMovementPatterns(geoLocations, staffId, date) {
  const productivityHistory = [];
  const minMovementThreshold = 0.01; // Minimum distance in km to consider as movement
  const minDurationThreshold = 60000; // 1 minute in milliseconds
  
  console.log(`Analyzing ${geoLocations.length} geolocations`);

  if (geoLocations.length < 2) {
    console.log('Not enough geolocations for analysis (need at least 2)');
    return productivityHistory;
  }

  // Sort by timestamp - ensure we handle different timestamp formats
  const sortedLocations = geoLocations.sort((a, b) => {
    // Convert to number if needed
    const timeA = typeof a.createdAt === 'string' ? parseInt(a.createdAt) : a.createdAt;
    const timeB = typeof b.createdAt === 'string' ? parseInt(b.createdAt) : b.createdAt;
    return timeA - timeB;
  });

  console.log('Sorted locations by timestamp');

  // Validate timestamps and coordinates
  const validatedLocations = sortedLocations.filter(loc => {
    const hasTimestamp = loc.createdAt && !isNaN(parseInt(loc.createdAt));
    const hasCoords = loc.latitude && loc.longitude && 
                      !isNaN(parseFloat(loc.latitude)) && 
                      !isNaN(parseFloat(loc.longitude));
    
    if (!hasTimestamp) {
      console.log('Location missing timestamp:', loc.id);
    }
    if (!hasCoords) {
      console.log('Location missing coordinates:', loc.id);
    }
    
    return hasTimestamp && hasCoords;
  });

  console.log(`Valid locations: ${validatedLocations.length} out of ${sortedLocations.length}`);

  if (validatedLocations.length < 2) {
    console.log('Not enough valid locations for analysis');
    return productivityHistory;
  }

  let currentState = null;
  let segmentStartTime = null;
  let segmentId = null;
  let segmentIndex = 0;

  for (let i = 0; i < validatedLocations.length - 1; i++) {
    const current = validatedLocations[i];
    const next = validatedLocations[i + 1];
    
    // Convert timestamps to numbers
    const currentTime = typeof current.createdAt === 'string' ? 
                        parseInt(current.createdAt) : current.createdAt;
    const nextTime = typeof next.createdAt === 'string' ? 
                     parseInt(next.createdAt) : next.createdAt;
    
    // Parse coordinates
    const lat1 = parseFloat(current.latitude);
    const lon1 = parseFloat(current.longitude);
    const lat2 = parseFloat(next.latitude);
    const lon2 = parseFloat(next.longitude);
    
    const timeDiff = nextTime - currentTime;
    
    // Skip if time difference is too large (more than 30 minutes)
    if (timeDiff > 30 * 60 * 1000) {
      console.log(`Large time gap detected at index ${i}: ${timeDiff / 60000} minutes`);
      
      // End current segment if exists
      if (currentState !== null && segmentStartTime !== null) {
        const duration = currentTime - segmentStartTime;
        if (duration >= minDurationThreshold) {
          productivityHistory.push(createProductivitySegment(
            segmentId || current.id,
            currentState,
            segmentStartTime,
            currentTime,
            duration
          ));
        }
      }
      
      // Reset for new segment
      currentState = null;
      segmentStartTime = null;
      segmentId = null;
      continue;
    }
    
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    
    // Determine movement type
    let movementType = distance > minMovementThreshold ? 0 : 1; // 0 = Moving, 1 = Not Moving
    
    console.log(`Segment ${i}: timeDiff=${timeDiff}ms, distance=${distance.toFixed(4)}km, type=${movementType}`);

    // Start new segment if needed
    if (currentState === null) {
      currentState = movementType;
      segmentStartTime = currentTime;
      segmentId = current.id || `segment_${staffId}_${segmentIndex++}`;
      console.log(`Started new segment: type=${movementType}, startTime=${new Date(segmentStartTime).toISOString()}`);
    } 
    // Check if state changed
    else if (movementType !== currentState) {
      const duration = currentTime - segmentStartTime;
      
      if (duration >= minDurationThreshold) {
        const segment = createProductivitySegment(
          segmentId,
          currentState,
          segmentStartTime,
          currentTime,
          duration
        );
        productivityHistory.push(segment);
        console.log(`Segment completed: ${segment.timePeriod}, duration=${segment.duration}, type=${currentState}`);
      } else {
        console.log(`Segment too short: ${duration}ms, skipping`);
      }
      
      // Start new segment
      currentState = movementType;
      segmentStartTime = currentTime;
      segmentId = current.id || `segment_${staffId}_${segmentIndex++}`;
      console.log(`Started new segment after state change: type=${movementType}`);
    }
    // Check if time gap is significant (more than 5 minutes)
    else if (timeDiff > 5 * 60 * 1000) {
      const duration = currentTime - segmentStartTime;
      
      if (duration >= minDurationThreshold) {
        const segment = createProductivitySegment(
          segmentId,
          currentState,
          segmentStartTime,
          currentTime,
          duration
        );
        productivityHistory.push(segment);
        console.log(`Segment completed due to time gap: ${segment.timePeriod}`);
      }
      
      // Start new segment
      segmentStartTime = currentTime;
      segmentId = current.id || `segment_${staffId}_${segmentIndex++}`;
      console.log(`Started new segment after time gap`);
    }
  }

  // Add the final segment
  if (currentState !== null && segmentStartTime !== null) {
    const lastLocation = validatedLocations[validatedLocations.length - 1];
    const lastTime = typeof lastLocation.createdAt === 'string' ? 
                    parseInt(lastLocation.createdAt) : lastLocation.createdAt;
    const duration = lastTime - segmentStartTime;
    
    if (duration >= minDurationThreshold) {
      const segment = createProductivitySegment(
        segmentId || lastLocation.id,
        currentState,
        segmentStartTime,
        lastTime,
        duration
      );
      productivityHistory.push(segment);
      console.log(`Final segment added: ${segment.timePeriod}, duration=${segment.duration}`);
    } else {
      console.log(`Final segment too short: ${duration}ms, skipping`);
    }
  }

  console.log(`Total segments created: ${productivityHistory.length}`);
  return productivityHistory;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  try {
    // Validate inputs
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      console.log('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
      return 0;
    }
    
    // Check if coordinates are valid latitude/longitude
    if (Math.abs(lat1) > 90 || Math.abs(lon1) > 180 || 
        Math.abs(lat2) > 90 || Math.abs(lon2) > 180) {
      console.log('Coordinates out of range:', { lat1, lon1, lat2, lon2 });
      return 0;
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
}


function createProductivitySegment(id, type, startTime, endTime, durationMs) {
  try {
    // Ensure timestamps are numbers
    const start = typeof startTime === 'string' ? parseInt(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseInt(endTime) : endTime;
    const duration = typeof durationMs === 'string' ? parseInt(durationMs) : durationMs;
    
    const durationMinutes = Math.floor(duration / 60000);
    const durationSeconds = Math.floor((duration % 60000) / 1000);
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('Invalid dates in segment:', { start, end });
      return null;
    }
    
    const typeConfig = {
      0: { // Moving
        color: "0xFFE3FFE3",
        label: "Moving",
        textcolor: "0xFF058F02"
      },
      1: { // Not Moving
        color: "0xFFFFE9E9",
        label: "Not Moving",
        textcolor: "0xFFDF0606"
      },
      2: { // Meeting
        color: "0xFFFFF4E3",
        label: "Meeting",
        textcolor: "0xFFF59E0B"
      }
    };

    const config = typeConfig[type] || typeConfig[1];

    return {
      startTime: start,
      endTime: end,
      duration: `${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`,
      type: type,
      statusInfo: {
        color: config.color,
        label: config.label,
        textcolor: config.textcolor
      },
      timePeriod: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')} - ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      id: { $oid: id ? id.toString() : generateSegmentId() }
    };
  } catch (error) {
    console.error('Error creating productivity segment:', error);
    return null;
  }
}

function calculateProductivityCounts(history) {
  const counts = {
    all: history.length,
    moving: 0,
    notMoving: 0,
    meeting: 0,
    offline: 0,
    similarity: 0
  };

  history.forEach(segment => {
    switch(segment.type) {
      case 0:
        counts.moving++;
        break;
      case 1:
        counts.notMoving++;
        break;
      case 2:
        counts.meeting++;
        break;
    }
  });

  return counts;
}

function generateSegmentId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}




async function getAllStaffProductivitySummary(date) {
  try {
    console.log(`Getting productivity summary for all staff on date: ${date}`);
    
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
      return {
        totalCount: 0,
        records: [],
        page: [10, 25, 50, 100]
      };
    }

    // Process all staff in parallel
    const summaryPromises = allStaff.map(async (staff) => {
      try {
        // Get productivity history for the staff
        const productivityData = await getProductivityHistory(staff.staffId.toString(), date);
        if(staff.staffId==3){
          console.log("id check 3")
        }
        // Calculate summary metrics
        const summary = calculateStaffProductivitySummary(productivityData, staff);
        
        return summary;
      } catch (error) {
        console.error(`Error processing staff ${staff.staffId}:`, error.message);
        // Return empty summary if error
        return getEmptyStaffSummary(staff);
      }
    });

    const allSummaries = await Promise.all(summaryPromises);
    
    // Filter out null results and sort by employee code
    const validSummaries = allSummaries.filter(summary => summary !== null);
    
    return {
      totalCount: validSummaries.length,
      records: validSummaries,
      page: [10, 25, 50, 100]
    };

  } catch (error) {
    console.error('Error in getAllStaffProductivitySummary:', error);
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

function calculateStaffProductivitySummary(productivityData, staff) {
  // If no data, return empty summary
  if(staff.staffId=='3'){
    console.log("print")
  }
  if (!productivityData || !productivityData.overview) {
    return getEmptyStaffSummary(staff);
  }

  const { overview, count } = productivityData;
  
  // Determine current location status based on last activity
  let cur_loc_status = 0; // Default to moving
  if (productivityData.productivityHistory && productivityData.productivityHistory.length > 0) {
    const lastSegment = productivityData.productivityHistory[productivityData.productivityHistory.length - 1];
    cur_loc_status = lastSegment.type; // 0 = moving, 1 = not moving, 2 = meeting
  }

  // Calculate cost center (you'll need to get this from your database)
  // For now, using a placeholder
  // const costCenter = getStaffCostCenter(staff.staffId);

  return {
    // companyId: 548, // You can make this configurable or get from database
    employeeId: staff.staffId,
    c_emp_id: staff.staffId,
    empCode: staff.staffCode,
    empName: staff.staffName,
    name: staff.staffName,
    branch_id:staff.branchId,
    branch_name:staff.branchName,
    departmentName:staff.departmentName,
    departmentId:staff.departmentId,
    // costCenter: costCenter,
    movingHrs: overview.totalTimeMoving,
    notmovingHrs: overview.totalTimeNotMoving,
    meetingHrs: overview.totalTimeMeeting,
    offlineHrs: "00:00", // You can calculate this if you have offline data
    totalWorkingHours: overview.totalTimeTracked,
    empName_icon: cur_loc_status === 0 ? "moving.png" : "notmoving.png",
    cur_loc_status: cur_loc_status,
    sortField: staff.staffCode.toLowerCase(),
    // id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`,
    // _id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`,
    // Additional metrics you might want
    totalKMMoved: overview.totalKMMoved,
    efficiencyScore: overview.efficiencyScore,
    averageSpeed: overview.averageSpeed
  };
}

// Helper function to get cost center (you'll need to implement based on your database)
async function getStaffCostCenter(staffId) {
  try {
    // Query to get staff's cost center/department/location
    const result = await sequelize.query(
      `SELECT d.department_name as costCenter
       FROM staffs s
       LEFT JOIN departments d ON s.department_id = d.department_id
       WHERE s.staff_id = ?`,
      { replacements: [staffId], type: QueryTypes.SELECT }
    );
    
    if (result && result[0] && result[0].costCenter) {
      return result[0].costCenter;
    }
    
    // Fallback: Get from branch if department not found
    const branchResult = await sequelize.query(
      `SELECT b.branch_name as costCenter
       FROM staffs s
       LEFT JOIN branches b ON s.branch_id = b.branch_id
       WHERE s.staff_id = ?`,
      { replacements: [staffId], type: QueryTypes.SELECT }
    );
    
    if (branchResult && branchResult[0] && branchResult[0].costCenter) {
      return branchResult[0].costCenter;
    }
    
    return "Not Assigned";
  } catch (error) {
    console.error(`Error getting cost center for staff ${staffId}:`, error);
    return "Unknown";
  }
}

function getEmptyStaffSummary(staff) {
  const costCenter = getStaffCostCenter(staff.staffId).catch(() => "Unknown");
  
  return {
    companyId: 548,
    staffId: staff.staffId,
    c_emp_id: staff.staffId,
    empCode: staff.staffCode,
    empName: staff.staffName,
    name: staff.staffName,
    costCenter: costCenter,
    movingHrs: "00:00",
    notmovingHrs: "00:00",
    meetingHrs: "00:00",
    offlineHrs: "00:00",
    totalWorkingHours: "00:00",
    empName_icon: "notmoving.png",
    cur_loc_status: 1, // Not moving by default
    sortField: staff.staffCode.toLowerCase(),
    // id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`,
    // _id: `staff_${staff.staffId}_${date.replace(/-/g, '')}`
  };
}

// Alternative: More efficient batch processing version
async function getAllStaffProductivitySummaryOptimized(date) {
  try {
    console.log(`Getting optimized productivity summary for all staff on date: ${date}`);
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime() - 1;

    // Get all active staff with their geolocations in a single query
    const allStaffData = await sequelize.query(
      `SELECT 
        s.staff_id as "staffId",
        s.staff_code as "staffCode",
        CONCAT(s.first_name, ' ', s.last_name) as "staffName",
        d.department_name as "costCenter",
        sg.latitude,
        sg.longitude,
        sg.action_type as "actionType",
        sg.record_created_at as "createdAt",
        sg.distance,
        sg.speed
      FROM staffs s
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN staff_geolocations sg ON s.staff_id = sg.staff_id 
        AND sg.record_created_at BETWEEN ? AND ?
      WHERE s.is_active = 1
      ORDER BY s.staff_id, sg.record_created_at`,
      { replacements: [startTimestamp, endTimestamp], type: QueryTypes.SELECT }
    );

    if (allStaffData.length === 0) {
      return {
        totalCount: 0,
        records: [],
        page: [10, 25, 50, 100]
      };
    }

    // Group data by staff
    const staffDataMap = new Map();
    allStaffData.forEach(row => {
      if (!staffDataMap.has(row.staffId)) {
        staffDataMap.set(row.staffId, {
          staffId: row.staffId,
          staffCode: row.staffCode,
          staffName: row.staffName,
          costCenter: row.costCenter || "Unknown",
          locations: []
        });
      }
      
      if (row.latitude && row.longitude && row.createdAt) {
        staffDataMap.get(row.staffId).locations.push({
          latitude: row.latitude,
          longitude: row.longitude,
          createdAt: row.createdAt,
          distance: row.distance,
          speed: row.speed,
          actionType: row.actionType
        });
      }
    });

    // Calculate productivity for each staff
    const summaries = [];
    for (const [staffId, staffData] of staffDataMap) {
      const summary = calculateStaffSummaryFromLocations(staffData, date);
      summaries.push(summary);
    }

    // Sort by employee code
    summaries.sort((a, b) => a.sortField.localeCompare(b.sortField));

    return {
      totalCount: summaries.length,
      records: summaries,
      page: [10, 25, 50, 100]
    };

  } catch (error) {
    console.error('Error in getAllStaffProductivitySummaryOptimized:', error);
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

function calculateStaffSummaryFromLocations(staffData, date) {
  const { staffId, staffCode, staffName, costCenter, locations } = staffData;
  
  if (locations.length < 2) {
    return getEmptySummary(staffId, staffCode, staffName, costCenter, date);
  }

  // Sort locations by timestamp
  const sortedLocations = locations.sort((a, b) => a.createdAt - b.createdAt);
  
  let totalMovingTime = 0;
  let totalNotMovingTime = 0;
  let totalMeetingTime = 0;
  let totalDistance = 0;
  const minMovementThreshold = 0.01;
  
  let currentState = null;
  let segmentStartTime = null;

  for (let i = 0; i < sortedLocations.length - 1; i++) {
    const current = sortedLocations[i];
    const next = sortedLocations[i + 1];
    
    const timeDiff = next.createdAt - current.createdAt;
    if (timeDiff <= 0) continue;
    
    const lat1 = parseFloat(current.latitude);
    const lon1 = parseFloat(current.longitude);
    const lat2 = parseFloat(next.latitude);
    const lon2 = parseFloat(next.longitude);
    
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;
    
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const movementType = distance > minMovementThreshold ? 0 : 1;
    
    // Check for meetings (Visit actions)
    const isMeeting = next.actionType && 
                     (next.actionType.includes('Visit') || 
                      next.actionType.includes('Meeting'));
    
    if (currentState === null) {
      currentState = isMeeting ? 2 : movementType;
      segmentStartTime = current.createdAt;
    } 
    else if ((isMeeting ? 2 : movementType) !== currentState || timeDiff > 30 * 60 * 1000) {
      // End current segment
      const duration = current.createdAt - segmentStartTime;
      addToTotalTime(currentState, duration);
      
      // Start new segment
      currentState = isMeeting ? 2 : movementType;
      segmentStartTime = current.createdAt;
    }
    
    // Add distance
    if (movementType === 0) {
      totalDistance += distance;
    }
  }

  // Add final segment
  if (currentState !== null && segmentStartTime !== null) {
    const lastTime = sortedLocations[sortedLocations.length - 1].createdAt;
    const duration = lastTime - segmentStartTime;
    addToTotalTime(currentState, duration);
  }

  const totalTrackedTime = totalMovingTime + totalNotMovingTime + totalMeetingTime;
  const cur_loc_status = getCurrentLocationStatus(sortedLocations);
  
  function addToTotalTime(state, duration) {
    switch(state) {
      case 0: totalMovingTime += duration; break;
      case 1: totalNotMovingTime += duration; break;
      case 2: totalMeetingTime += duration; break;
    }
  }

  return {
    companyId: 548,
    employeeId: staffId,
    c_emp_id: staffId,
    empCode: staffCode,
    empName: staffName,
    name: staffName,
    costCenter: costCenter,
    movingHrs: formatTime(totalMovingTime),
    notmovingHrs: formatTime(totalNotMovingTime),
    meetingHrs: formatTime(totalMeetingTime),
    offlineHrs: "00:00",
    totalWorkingHours: formatTime(totalTrackedTime),
    empName_icon: cur_loc_status === 0 ? "moving.png" : "notmoving.png",
    cur_loc_status: cur_loc_status,
    sortField: staffCode.toLowerCase(),
    id: `staff_${staffId}_${date.replace(/-/g, '')}`,
    _id: `staff_${staffId}_${date.replace(/-/g, '')}`,
    totalKMMoved: parseFloat(totalDistance.toFixed(2))
  };
}

function getCurrentLocationStatus(locations) {
  if (locations.length === 0) return 1; // Not moving
  
  const lastLocation = locations[locations.length - 1];
  const secondLastLocation = locations.length > 1 ? locations[locations.length - 2] : null;
  
  if (!secondLastLocation) return 1;
  
  const lat1 = parseFloat(secondLastLocation.latitude);
  const lon1 = parseFloat(secondLastLocation.longitude);
  const lat2 = parseFloat(lastLocation.latitude);
  const lon2 = parseFloat(lastLocation.longitude);
  
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 1;
  
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance > 0.01 ? 0 : 1;
}

function formatTime(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function getEmptySummary(staffId, staffCode, staffName, costCenter, date) {
  return {
    companyId: 548,
    employeeId: staffId,
    c_emp_id: staffId,
    empCode: staffCode,
    empName: staffName,
    name: staffName,
    costCenter: costCenter || "Unknown",
    movingHrs: "00:00",
    notmovingHrs: "00:00",
    meetingHrs: "00:00",
    offlineHrs: "00:00",
    totalWorkingHours: "00:00",
    empName_icon: "notmoving.png",
    cur_loc_status: 1,
    sortField: staffCode.toLowerCase(),
    id: `staff_${staffId}_${date.replace(/-/g, '')}`,
    _id: `staff_${staffId}_${date.replace(/-/g, '')}`
  };
}
module.exports = {
  getEmployeeTracking,
  getTimeIntervalsByDate,
  getGeoLocationsByDate,
  getAllEmployeeTracking,
  getLastGeoLocationByDate,
  getCounts,
  getTotalDistance,
  getProductivityHistory,
  getAllStaffProductivitySummary,
  getAllStaffProductivitySummaryOptimized
};