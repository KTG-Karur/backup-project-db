"use strict";
const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffGeolocations(query) {
  try {
    let filters = [];
    
    if (query && Object.keys(query).length) {
      if (query.staffId) {
        filters.push(`sg.staff_id = ${query.staffId}`);
      }
      if (query.startDate && query.endDate) {
        filters.push(`sg.record_createdAt BETWEEN ${query.startDate} AND ${query.endDate}`);
      }
      if (query.actionType) {
        filters.push(`sg.actionType = '${query.actionType}'`);
      }
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await sequelize.query(`
      SELECT 
        sg.id,
        sg.staff_id as "staffId",
        sg.type,
        sg.latitude,
        sg.longitude,
        sg.attendanceMarkType as "attendanceMarkType",
        sg.attendanceType as "attendanceType",
        sg.actionType as "actionType",
        sg.battery,
        sg.networkStatus as "networkStatus",
        sg.flightMode as "flightMode",
        sg.speed,
        sg.distance,
        sg.kmDifference as "kmDifference",
        sg.totalDistance as "totalDistance",
        sg.coordinatesPoints as "coordinatesPoints",
        sg.imageName as "imageName",
        sg.imageUrl as "imageUrl",
        sg.record_createdAt as "recordCreatedAt",
        sg.createdAt,
        sg.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as "staffName",
        s.staff_code as "staffCode"
      FROM staff_geolocations sg
      LEFT JOIN staffs s ON s.staff_id = sg.staff_id
      ${whereClause}
      ORDER BY sg.record_createdAt DESC
    `, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function getStaffGeolocationDetails(query) {
  try {
    let filters = [];
    
    if (query && Object.keys(query).length) {
      if (query.id) {
        filters.push(`sg.id = ${query.id}`);
      }
      if (query.staffId) {
        filters.push(`sg.staff_id = ${query.staffId}`);
      }
    }

    if (filters.length === 0) {
      throw new Error(messages.INVALID_PARAMETERS);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const result = await sequelize.query(`
      SELECT 
        sg.id,
        sg.staff_id as "staffId",
        sg.type,
        sg.latitude,
        sg.longitude,
        sg.attendanceMarkType as "attendanceMarkType",
        sg.attendanceType as "attendanceType",
        sg.actionType as "actionType",
        sg.status as "status",
        sg.permissionStatus as "permissionStatus",
        sg.battery,
        sg.networkStatus as "networkStatus",
        sg.flightMode as "flightMode",
        sg.speed,
        sg.distance,
        sg.kmDifference as "kmDifference",
        sg.totalDistance as "totalDistance",
        sg.coordinatesPoints as "coordinatesPoints",
        sg.imageName as "imageName",
        sg.imageUrl as "imageUrl",
        sg.record_createdAt as "recordCreatedAt",
        sg.createdAt,
        sg.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as "staffName",
        s.staff_code as "staffCode",
        s.contact_no as "contactNo",
        s.email_id as "emailId"
      FROM staff_geolocations sg
      LEFT JOIN staffs s ON s.staff_id = sg.staff_id
      ${whereClause}
      LIMIT 1
    `, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffGeolocation(postData) {
  const transaction = await sequelize.transaction();
  
  try {
    // Prepare coordinates points from latitude and longitude if provided
    if (postData.latitude && postData.longitude && !postData.coordinatesPoints) {
      postData.coordinatesPoints = `${postData.latitude},${postData.longitude}`;
    }

    // Set record_createdAt to current timestamp if not provided
    if (!postData.recordCreatedAt) {
      postData.recordCreatedAt = Date.now();
    }

    const executeMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key));
    
    // Create staff geolocation using Sequelize model
    const result = await sequelize.models.staff_geolocations.create(executeMethod, { transaction });
    
    await transaction.commit();
    
    // Emit socket event for live location update
    try {
      const { getIO } = require('../socket-manager');
      const io = getIO();
      if (io) {
        const geoRecord = {
          staffId: postData.staffId,
          latitude: postData.latitude,
          longitude: postData.longitude,
          speed: postData.speed,
          battery: postData.battery,
          networkStatus: postData.networkStatus,
          actionType: postData.actionType,
          recordCreatedAt: postData.recordCreatedAt || Date.now(),
        };
        io.emit('geo:update', geoRecord);
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError.message);
    }
    
    // Return created record - use id instead of geo_id
    const req = { id: result.id };
    return await getStaffGeolocationDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffGeolocation(id, putData) {
  const transaction = await sequelize.transaction();
  
  try {
    // Prepare coordinates points from latitude and longitude if provided
    if (putData.latitude && putData.longitude && !putData.coordinatesPoints) {
      putData.coordinatesPoints = `${putData.latitude},${putData.longitude}`;
    }

    const executeMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
    
    // Update staff geolocation using Sequelize model
    const result = await sequelize.models.staff_geolocations.update(executeMethod, {
      where: { id: id },
      transaction
    });

    if (result[0] === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }
    
    await transaction.commit();
    
    // Return updated record
    const req = { id: id };
    return await getStaffGeolocationDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaffGeolocation(id) {
  const transaction = await sequelize.transaction();
  
  try {
    // Hard delete for geolocation data
    const result = await sequelize.models.staff_geolocations.destroy({
      where: { id: id },
      transaction
    });

    if (result === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }
    
    await transaction.commit();
    
    return { message: messages.DELETE_SUCCESS };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function bulkCreateStaffGeolocations(geolocationsData, staffId) {
  const transaction = await sequelize.transaction();
  try {
    const results = [];
    const errors = [];
    
    if (!Array.isArray(geolocationsData) || geolocationsData.length === 0) {
      throw new Error('Geolocations data must be a non-empty array');
    }
    
    // Get base date from first record or use today
    const baseDate = geolocationsData[0]?.createdAt ? 
      new Date(geolocationsData[0].createdAt) : new Date();
    
    // Set start of work day (9 AM)
    baseDate.setHours(9, 0, 0, 0);
    const startOfDay = baseDate.getTime();
    
    // Calculate realistic time intervals (spread over 9 hours)
    const totalWorkingHours = 9;
    const totalWorkingMs = totalWorkingHours * 60 * 60 * 1000;
    const timeInterval = Math.floor(totalWorkingMs / geolocationsData.length);
    
    console.log(`Creating ${geolocationsData.length} records`);
    
    // Track coordinates for realistic movement
    let currentLat = null;
    let currentLon = null;
    let totalDistance = 0;
    
    for (let i = 0; i < geolocationsData.length; i++) {
      const geoData = geolocationsData[i];
      
      try {
        // Extract coordinates
        let latitude, longitude;
        
        if (Array.isArray(geoData.coordinates) && geoData.coordinates.length >= 2) {
          longitude = geoData.coordinates[0]?.toString();
          latitude = geoData.coordinates[1]?.toString();
        } else if (geoData.latitude && geoData.longitude) {
          latitude = geoData.latitude;
          longitude = geoData.longitude;
        } else {
          // Generate coordinates if not provided
          if (currentLat === null || currentLon === null) {
            currentLat = 10.9359192;
            currentLon = 78.7060128;
          } else {
            // Simulate slight movement
            const latChange = (Math.random() - 0.5) * 0.001;
            const lonChange = (Math.random() - 0.5) * 0.001;
            currentLat += latChange;
            currentLon += lonChange;
          }
          latitude = currentLat.toFixed(7);
          longitude = currentLon.toFixed(7);
        }
        
        // Calculate timestamp
        const recordTimestamp = startOfDay + (i * timeInterval);
        const randomVariation = Math.floor((Math.random() - 0.5) * timeInterval * 0.2);
        const finalTimestamp = recordTimestamp + randomVariation;
        
        // Calculate distance and speed
        let distance = '0.00';
        let speed = '0.00';
        
        if (i > 0 && results[i-1]?.data) {
          const prevRecord = results[i-1].data;
          const timeDiff = finalTimestamp - prevRecord.recordCreatedAt;
          
          if (prevRecord.latitude && prevRecord.longitude) {
            const prevLat = parseFloat(prevRecord.latitude);
            const prevLon = parseFloat(prevRecord.longitude);
            const currLat = parseFloat(latitude);
            const currLon = parseFloat(longitude);
            
            if (!isNaN(prevLat) && !isNaN(prevLon) && !isNaN(currLat) && !isNaN(currLon)) {
              // Haversine formula for distance
              const R = 6371;
              const dLat = (currLat - prevLat) * Math.PI / 180;
              const dLon = (currLon - prevLon) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prevLat * Math.PI / 180) * Math.cos(currLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const calculatedDistance = R * c;
              
              // Make distance more realistic (sometimes 0 for stationary)
              if (Math.random() > 0.3 && timeDiff > 0) {
                distance = (calculatedDistance * (timeDiff / (5 * 60 * 1000))).toFixed(2);
                totalDistance += parseFloat(distance);
                
                // Calculate speed (km/h)
                const hours = timeDiff / (1000 * 60 * 60);
                speed = hours > 0 ? (parseFloat(distance) / hours).toFixed(2) : '0.00';
              }
            }
          }
        }
        
        // Determine action type
        let actionType = geoData.actionType;
        if (!actionType) {
          if (i === 0) {
            actionType = 'Punch In-Tracker';
          } else if (i === geolocationsData.length - 1) {
            actionType = 'Punch Out-Tracker';
          } else {
            actionType = 'GPS Tracker';
          }
        }
        
        // Prepare data for insertion
        const postData = {
          staff_id: parseInt(staffId),
          type: geoData.type || 'Point',
          latitude: latitude,
          longitude: longitude,
          attendance_mark_type: geoData.attendanceMarkType || 0,
          attendance_type: geoData.attendanceType || 0,
          action_type: actionType,
          battery: geoData.battery?.toString() || 
                   Math.max(20, Math.floor(100 - (i * 0.1))).toString(),
          network_status: geoData.networkStatus || 
                         (Math.random() > 0.2 ? 'Cellular' : 'Wi-Fi'),
          permission_status: geoData.permissionStatus || 'granted',
          status: geoData.status || 'active',
          flight_mode: 'false',
          speed: speed,
          distance: distance,
          km_difference: geoData.kmDifference?.toString() || distance,
          total_distance: totalDistance.toFixed(2),
          coordinates_points: geoData.coordinatesPoints || `${latitude},${longitude}`,
          image_name: geoData.imageName || 
                     (i === 0 ? `${staffId}_${finalTimestamp}.png` : ''),
          image_url: geoData.imageUrl || '',
          record_created_at: finalTimestamp
          // Note: Don't include created_at/updated_at - let Sequelize handle them
        };
        
        // Create record
        const result = await sequelize.models.staff_geolocations.create(postData, {
          transaction,
          returning: true
        });
        
        // Get the created record with correct field names
        const createdRecord = await sequelize.query(
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
          WHERE id = ?`,
          {
            replacements: [result.id],
            type: QueryTypes.SELECT,
            transaction
          }
        );
        
        if (createdRecord && createdRecord[0]) {
          results.push({
            index: i,
            id: result.id,
            timestamp: finalTimestamp,
            timestampReadable: new Date(finalTimestamp).toISOString(),
            status: 'success',
            data: {
              ...createdRecord[0],
              id: { $oid: createdRecord[0].id.toString() },
              coordinates: [parseFloat(createdRecord[0].longitude), parseFloat(createdRecord[0].latitude)]
            }
          });
        } else {
          results.push({
            index: i,
            id: result.id,
            timestamp: finalTimestamp,
            status: 'success',
            data: null
          });
        }
        
      } catch (recordError) {
        console.error(`Error creating record ${i}:`, recordError.message);
        errors.push({
          index: i,
          status: 'error',
          error: recordError.message,
          data: geoData
        });
      }
    }
    
    await transaction.commit();
    
    // Log summary
    if (results.length > 0) {
      const timestamps = results.filter(r => r.timestamp).map(r => r.timestamp);
      if (timestamps.length > 0) {
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        console.log(`Created ${results.length} records`);
        console.log(`Time range: ${new Date(minTime).toISOString()} to ${new Date(maxTime).toISOString()}`);
        console.log(`Duration: ${(maxTime - minTime) / (1000 * 60)} minutes`);
      }
    }
    
    return {
      success: true,
      totalRecords: geolocationsData.length,
      successful: results.length,
      failed: errors.length,
      results: results.slice(0, 5), // Return first 5 for response
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      summary: {
        startTime: results.length > 0 && results[0].timestamp ? 
                  new Date(results[0].timestamp).toISOString() : null,
        endTime: results.length > 0 && results[results.length - 1].timestamp ? 
                 new Date(results[results.length - 1].timestamp).toISOString() : null,
        durationMinutes: results.length > 0 && results[0].timestamp && results[results.length - 1].timestamp ?
                        (results[results.length - 1].timestamp - results[0].timestamp) / (1000 * 60) : 0
      }
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Transaction error:', error);
    throw new Error(error.message ? error.message : 'Operation failed');
  }
}

async function getAdminLiveTracking(query) {
  try {
    if (!query.date) {
      throw new Error("date parameter is required (YYYY-MM-DD)");
    }
    const queryDate = query.date;
    const moment = require('moment');
    const startOfDay = moment(queryDate).startOf('day').valueOf();
    const endOfDay = moment(queryDate).endOf('day').valueOf();

    // 1. Get all active staff (excluding Super Admin role_id = 1)
    const activeStaff = await sequelize.query(
      `SELECT staff_id AS "staffId", CONCAT(first_name, ' ', last_name) AS "staffName"
       FROM staffs
       WHERE is_active = 1 AND role_id != 1`,
      { type: QueryTypes.SELECT }
    );

    if (!activeStaff || activeStaff.length === 0) {
      return [];
    }

    // 2. Fetch all geolocations for this date
    const geolocations = await sequelize.query(
      `SELECT staff_id AS "staffId", latitude, longitude, record_createdAt AS "recordCreatedAt"
       FROM staff_geolocations
       WHERE record_createdAt BETWEEN :startOfDay AND :endOfDay
       ORDER BY record_createdAt ASC`,
      {
        replacements: { startOfDay, endOfDay },
        type: QueryTypes.SELECT
      }
    );

    // Group geolocations by staffId
    const geoByStaff = {};
    geolocations.forEach(geo => {
      if (!geoByStaff[geo.staffId]) {
        geoByStaff[geo.staffId] = [];
      }
      geoByStaff[geo.staffId].push(geo);
    });

    const response = [];

    // Haversine formula
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const staff of activeStaff) {
      const staffId = staff.staffId;
      const points = geoByStaff[staffId] || [];

      let totalKm = 0;
      let lastLocation = null;

      // Filter out points with invalid coordinates
      const validPoints = points.filter(p => {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });

      if (validPoints.length > 0) {
        // Calculate cumulative distance
        for (let i = 0; i < validPoints.length - 1; i++) {
          const p1 = validPoints[i];
          const p2 = validPoints[i + 1];
          const dist = getDistance(
            parseFloat(p1.latitude),
            parseFloat(p1.longitude),
            parseFloat(p2.latitude),
            parseFloat(p2.longitude)
          );
          totalKm += dist;
        }

        const lastRec = validPoints[validPoints.length - 1];
        lastLocation = {
          lat: parseFloat(lastRec.latitude),
          lng: parseFloat(lastRec.longitude),
          timestamp: lastRec.recordCreatedAt
        };
      }

      response.push({
        user_id: staffId,
        employee_name: staff.staffName,
        total_km: parseFloat(totalKm.toFixed(2)),
        last_location: lastLocation
      });
    }

    return response;
  } catch (error) {
    throw new Error(error.message || "Operation error");
  }
}

module.exports = {
  getStaffGeolocations,
  updateStaffGeolocation,
  createStaffGeolocation,
  getStaffGeolocationDetails,
  deleteStaffGeolocation,
  bulkCreateStaffGeolocations,
  getAdminLiveTracking,
};

