"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getTransferStaff(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.transferStaffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.transfer_staff_id = ${query.transferStaffId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
      // if (query.branchId) {
      //   iql += count >= 1 ? ` AND` : ``;
      //   count++;
      //   iql += ` ts.branch_id = ${query.branchId}`;
      // }
      if (query.branchId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        if (query.branchId.includes(',')) {
            const branchIds = query.branchId.split(',')
                .map(id => id.trim())
                .filter(id => id !== ''); 
            
            if (branchIds.length > 0) {
                const orConditions = branchIds.map(id => `ts.branch_id = ${id}`).join(' OR ');
                iql += ` (${orConditions})`;
            }
        } else {
            iql += ` ts.branch_id = ${query.branchId}`;
        }
    }
    }
    const result = await sequelize.query(`SELECT ts.transfer_staff_id "transferStaffId",
       s.staff_profile_image_name AS "staffProfile",
       s.staff_code AS "staffCode",
      ts.staff_id "staffId",CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName,
      s.address "address",
      ts.transfer_code "transferCode", ts.joining_date "joiningDate",
      ts.relieving_date "relievingDate",
      b.branch_id "transferFrom", b2.branch_id "transferTo",
      b.branch_name "transferFromName", b2.branch_name "transferToName",
      ts.transfered_by "transferedById",CONCAT(s.first_name,' ',s.last_name) as transferedBy,
      ts.createdAt,ts.status_id "statusId",
      des.designation_name 'designationName',  dep.department_name 'departmentName'
      FROM transfer_staffs ts
      left join branches b on b.branch_id = ts.transfer_from
      left join branches b2 on b2.branch_id = ts.transfer_to
      left join staffs s on s.staff_id = ts.staff_id 
      left join designation des on des.designation_id = s.designation_id 
      left join department dep on dep.department_id = s.department_id
      left join status_lists sur on sur.status_list_id = s.surname_id
      left join staffs s2 on s2.staff_id = ts.transfered_by ${iql}
      ORDER BY ts.transfer_staff_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createTransferStaff(postData) {
  try {
    const countResult = await sequelize.query(`SELECT ts.transfer_code "transferCode"
      FROM transfer_staffs ts ORDER BY ts.transfer_staff_id DESC LIMIT 1`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const applicantCodeFormat = `K3-KRR-`
    const count = countResult.length > 0 ? parseInt(countResult[0].transferCode.split("-").pop()) : `00000`
    postData.transferCode = await generateSerialNumber(applicantCodeFormat, count)

    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))


    if (excuteMethod?.staff_id || false && excuteMethod?.joining_date || false) {
      const existingTransferStaff = await sequelize.models.transfer_staff.findOne({
        where: {
          staff_id: excuteMethod.staff_id, joining_date: excuteMethod.joining_date
        }
      });
      if (existingTransferStaff) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const transferStaffResult = await sequelize.models.transfer_staff.create(excuteMethod);
    const req = {
      transferStaffId: transferStaffResult.transfer_staff_id
    }
    return await getTransferStaff(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateTransferStaff(transferStaffId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.staff_id || false && excuteMethod?.joining_date || false) {
      const duplicateTransferStaff = await sequelize.models.transfer_staff.findOne({
        where: sequelize.literal(`staff_id = '${excuteMethod.staff_id}' AND joining_date = '${excuteMethod.joining_date}'   AND 	transfer_staff_id != ${transferStaffId}`)
      });
      if (duplicateTransferStaff) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const transferStaffResult = await sequelize.models.transfer_staff.update(excuteMethod, { where: { transfer_staff_id: transferStaffId } });
    const req = {
      transferStaffId: transferStaffId
    }
    return await getTransferStaff(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getTransferStaff,
  updateTransferStaff,
  createTransferStaff
};