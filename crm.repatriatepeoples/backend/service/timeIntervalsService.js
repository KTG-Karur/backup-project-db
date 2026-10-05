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
    
    // Get counts
    const counts = await getCounts(staffId, date);
    
    // Calculate total distance
    const totalDistance = await getTotalDistance(staffId, date);

    return {
      count: counts,
      records: {
        employeeId: staff.staffId,
        subDomain: "K3_W300", // You might want to make this dynamic
        empCode: staff.staffCode,
        empName: staff.staffName,
        geoLocation: geoLocations,
        timeInterval: timeIntervals,
        totalDistance: totalDistance,
        attendanceDate: formatDate(date),
        shiftWithException: "GS(07:00 - 19:00)", // You might want to make this dynamic
        id: `staff_${staffId}_${date.replace(/-/g, '')}`,
        _id: `staff_${staffId}_${date.replace(/-/g, '')}`
      }
    };
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function getTimeIntervalsByDate(staffId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime() - 1;

  const result = await sequelize.query(
    `SELECT 
      interval_id as "id",
      staff_id as "staffId",
      timeStatus as "timeStatus",
      attendanceMarkType as "attendanceMarkType",
      status,
      attendanceType as "attendanceType",
      imageName as "imageName",
      networkStatus as "networkStatus",
      battery,
      flightMode as "flightMode",
      address,
      brand,
      manufacturer,
      board,
      device,
      display,
      hardware,
      model,
      product,
      updatedAtMobile as "updatedAt",
      latitude,
      longitude,
      coordinates,
      actionType as "actionType",
      workTime as "workTime",
      totalWorkTime as "totalWorkTime",
      distance,
      speed,
      kmDifference as "kmDifference",
      timeTravelled as "timeTravelled",
      mobileStatus as "mobileStatus",
      image as "image",
      createdAt as "createdAt"
    FROM staff_time_intervals 
    WHERE staff_id = ? 
      AND createdAt BETWEEN ? AND ?
    ORDER BY createdAt ASC`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  return result.map(item => ({
    ...item,
    id: { $oid: item.id.toString() },
    coordinates: item.coordinates || [parseFloat(item.longitude), parseFloat(item.latitude)]
  }));
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
      attendance_mark_type as "attendanceMarkType",
      attendance_type as "attendanceType",
      action_type as "actionType",
      battery,
      network_status as "networkStatus",
      flight_mode as "flightMode",
      speed,
      distance,
      km_difference as "kmDifference",
      total_distance as "totalDistance",
      coordinates_points as "coordinatesPoints",
      image_name as "imageName",
      image_url as "imageUrl",
      record_created_at as "createdAt"
    FROM staff_geolocations 
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
    coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)],
    coordinatesPoints: item.coordinatesPoints || `${item.latitude},${item.longitude}`,
    mobileStatus: `${item.battery}%,${item.networkStatus}`
  }));
}

async function getCounts(staffId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime() - 1;

  // Count client visits (Visit In/Out actions)
  const clientVisitCount = await sequelize.query(
    `SELECT COUNT(*) as count 
     FROM staff_time_intervals 
     WHERE staff_id = ? 
       AND createdAt BETWEEN ? AND ?
       AND actionType = 'Visit In-Tracker'`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  // Count total configurations/records
  const configCount = await sequelize.query(
    `SELECT COUNT(*) as count 
     FROM staff_time_intervals 
     WHERE staff_id = ? 
       AND createdAt BETWEEN ? AND ?`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  return {
    clientVisitCount: parseInt(clientVisitCount[0].count) || 0,
    config: parseInt(configCount[0].count) || 0
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
       AND record_created_at BETWEEN ? AND ?
       AND distance IS NOT NULL 
       AND distance != ''`,
    {
      replacements: [staffId, startTimestamp, endTimestamp],
      type: QueryTypes.SELECT
    }
  );

  return parseFloat(result[0].totalDistance) || 0;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options).replace(/\s/g, '-');
}

module.exports = {
  getEmployeeTracking,
  getTimeIntervalsByDate,
  getGeoLocationsByDate,
  getCounts,
  getTotalDistance
};