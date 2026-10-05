"use strict";
const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffTimeIntervals(query) {
  try {
    let filters = [];
    
    if (query && Object.keys(query).length) {
      if (query.staffId) {
        filters.push(`sti.staff_id = ${query.staffId}`);
      }
      if (query.date) {
        filters.push(`DATE(FROM_UNIXTIME(sti.timeStatus/1000)) = '${query.date}'`);
      }
      if (query.attendanceType) {
        filters.push(`sti.attendance_type = ${query.attendanceType}`);
      }
      if (query.startDate && query.endDate) {
        filters.push(`sti.timeStatus BETWEEN ${query.startDate} AND ${query.endDate}`);
      }
    }

    filters.push(`sti.status = 1`);
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await sequelize.query(`
      SELECT 
        sti.interval_id "intervalId",
        sti.staff_id "staffId",
        sti.time_status "timeStatus",
        sti.attendance_mark_type "attendanceMarkType",
        sti.status,
        sti.attendance_type "attendanceType",
        sti.address,
        sti.image_name "imageName",
        sti.network_status "networkStatus",
        sti.battery,
        sti.flight_mode "flightMode",
        sti.latitude,
        sti.longitude,
        sti.coordinates,
        sti.action_type "actionType",
        sti.work_time "workTime",
        sti.total_work_time "totalWorkTime",
        sti.distance,
        sti.speed,
        sti.km_difference "kmDifference",
        sti.time_travelled "timeTravelled",
        sti.mobile_status "mobileStatus",
        sti.updated_at_mobile "updatedAtMobile",
        sti.createdAt,
        sti.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as staffName,
        s.staff_code "staffCode"
      FROM staff_time_intervals sti
      LEFT JOIN staffs s ON s.staff_id = sti.staff_id
      ${whereClause}
      ORDER BY sti.time_status DESC
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

async function getStaffTimeIntervalDetails(query) {
  try {
    let filters = [];
    
    if (query && Object.keys(query).length) {
      if (query.intervalId) {
        filters.push(`sti.interval_id = ${query.intervalId}`);
      }
      if (query.staffId) {
        filters.push(`sti.staff_id = ${query.staffId}`);
      }
    }

    if (filters.length === 0) {
      throw new Error(messages.INVALID_PARAMETERS);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const result = await sequelize.query(`
      SELECT 
        sti.interval_id "intervalId",
        sti.staff_id "staffId",
        sti.time_status "timeStatus",
        sti.attendance_mark_type "attendanceMarkType",
        sti.status,
        sti.attendance_type "attendanceType",
        sti.address,
        sti.image_name "imageName",
        sti.network_status "networkStatus",
        sti.battery,
        sti.flight_mode "flightMode",
        sti.latitude,
        sti.longitude,
        sti.coordinates,
        sti.action_type "actionType",
        sti.work_time "workTime",
        sti.total_work_time "totalWorkTime",
        sti.distance,
        sti.speed,
        sti.km_difference "kmDifference",
        sti.time_travelled "timeTravelled",
        sti.mobile_status "mobileStatus",
        sti.brand,
        sti.manufacturer,
        sti.board,
        sti.device,
        sti.display,
        sti.hardware,
        sti.model,
        sti.product,
        sti.image,
        sti.updated_at_mobile "updatedAtMobile",
        sti.createdAt,
        sti.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as staffName,
        s.staff_code "staffCode",
        s.contact_no "contactNo",
        s.email_id "emailId"
      FROM staff_time_intervals sti
      LEFT JOIN staffs s ON s.staff_id = sti.staff_id
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

async function createStaffTimeInterval(postData) {
  const transaction = await sequelize.transaction();
  
  try {
    // Prepare coordinates from latitude and longitude
    if (postData.latitude && postData.longitude) {
      postData.coordinates = [parseFloat(postData.longitude), parseFloat(postData.latitude)];
    }

    const executeMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key));
    
    // Create staff time interval using Sequelize model
    const result = await sequelize.models.staff_time_intervals.create(executeMethod, { transaction });
    
    await transaction.commit();
    
    // Return created record
    const req = { intervalId: result.interval_id };
    return await getStaffTimeIntervalDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffTimeInterval(intervalId, putData) {
  const transaction = await sequelize.transaction();
  
  try {
    // Prepare coordinates from latitude and longitude if provided
    if (putData.latitude && putData.longitude) {
      putData.coordinates = [parseFloat(putData.longitude), parseFloat(putData.latitude)];
    }

    const executeMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
    
    // Update staff time interval using Sequelize model
    const result = await sequelize.models.staff_time_intervals.update(executeMethod, {
      where: { interval_id: intervalId },
      transaction
    });

    if (result[0] === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }
    
    await transaction.commit();
    
    // Return updated record
    const req = { intervalId: intervalId };
    return await getStaffTimeIntervalDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaffTimeInterval(intervalId) {
  const transaction = await sequelize.transaction();
  
  try {
    // Soft delete by setting status to 0
    const result = await sequelize.models.staff_time_intervals.update(
      { status: 0 },
      {
        where: { interval_id: intervalId },
        transaction
      }
    );

    if (result[0] === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }
    
    await transaction.commit();
    
    return { message: messages.DELETE_SUCCESS };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffTimeIntervals,
  updateStaffTimeInterval,
  createStaffTimeInterval,
  getStaffTimeIntervalDetails,
  deleteStaffTimeInterval,
};