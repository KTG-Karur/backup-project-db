"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getAttendanceIncharge(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.attendanceInchargeId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.attendance_incharge_id = ${query.attendanceInchargeId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
      // if (query.branchId) {
      //   iql += count >= 1 ? ` AND` : ``;
      //   count++;
      //   iql += ` s.branch_id = ${query.branchId}`;
      // }
      if (query.branchId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        if (query.branchId.includes(',')) {
            const branchIds = query.branchId.split(',')
                .map(id => id.trim())
                .filter(id => id !== ''); 
            
            if (branchIds.length > 0) {
                const orConditions = branchIds.map(id => `s.branch_id = ${id}`).join(' OR ');
                iql += ` (${orConditions})`;
            }
        } else {
            iql += ` s.branch_id = ${query.branchId}`;
        }
    }
    }
    const result = await sequelize.query(`SELECT ts.attendance_incharge_id "attendanceInchargeId",
      ts.staff_id "staffId",CONCAT(s.first_name,' ',s.last_name) as staffName,
      ts.is_active as isActive,
      ts.department_id "departmentId", ts.branch_id "branchId", b.branch_name "branchName", d.department_name "departmentName", ts.createdAt,ts.status_id "statusId"
      FROM attendance_incharges ts
      left join staffs s on s.staff_id = ts.staff_id
      left join branches b on b.branch_id = ts.branch_id
      left join department d on d.department_id = ts.department_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createAttendanceIncharge(postData) {
  try {

    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.staff_id || false && excuteMethod?.branch_id || false && excuteMethod?.department_id || false) {
      const existingAttendanceIncharge = await sequelize.models.attendance_incharge.findOne({
        where: {
          staff_id: excuteMethod.staff_id, branch_id: excuteMethod.branch_id, department_id: excuteMethod.department_id
        }
      });
      if (existingAttendanceIncharge) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }
    const attendanceInchargeResult = await sequelize.models.attendance_incharge.create(excuteMethod);
    const req = {
      attendanceInchargeId: attendanceInchargeResult.attendance_incharge_id
    }
    return await getAttendanceIncharge(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateAttendanceIncharge(attendanceInchargeId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.staff_id || false && excuteMethod?.branch_id || false && excuteMethod?.department_id || false) {
      const duplicateAttendanceIncharge = await sequelize.models.attendance_incharge.findOne({
        where: sequelize.literal(`staff_id = '${excuteMethod.staff_id}' AND branch_id = '${excuteMethod.branch_id}' AND department_id = '${excuteMethod.department_id}'   AND 	attendance_incharge_id != ${attendanceInchargeId}`)
      });
      if (duplicateAttendanceIncharge) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const attendanceInchargeResult = await sequelize.models.attendance_incharge.update(excuteMethod, { where: { attendance_incharge_id: attendanceInchargeId } });
    const req = {
      attendanceInchargeId: attendanceInchargeId
    }
    return await getAttendanceIncharge(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getAttendanceIncharge,
  updateAttendanceIncharge,
  createAttendanceIncharge
};