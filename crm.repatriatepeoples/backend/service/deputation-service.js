"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getDeputation(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.deputationId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.deputation_id = ${query.deputationId}`;
      }
      if (query.fromPlace) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        if (query.fromPlace.includes(',')) {
          const fromPlaces = query.fromPlace.split(',')
            .map(id => id.trim())
            .filter(id => id !== '');

          if (fromPlaces.length > 0) {
            const orConditions = fromPlaces.map(id => `ts.from_place = ${id}`).join(' OR ');
            iql += ` (${orConditions})`;
          }
        } else {
          iql += ` ts.from_place = ${query.fromPlace}`;
        }
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
    }
    const result = await sequelize.query(`SELECT ts.deputation_id "deputationId",
      s.staff_profile_image_name AS "staffProfile",
        s.staff_code "staffCode",
      ts.staff_id "staffId",CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName,
      ts.deputation_code "deputationCode", ts.deputation_date "deputationDate", ts.status_id "statusId",
      des.designation_name 'designationName',  dep.department_name 'departmentName',
      ts.from_date "fromDate", ts.to_date "toDate", b.branch_id "fromPlace", b2.branch_id "toPlace",
      b.branch_name "fromPlaceName", b2.branch_name "toPlaceName", ts.reason "reason",ts.deputation_by "deputationById",CONCAT(s.first_name,' ',s.last_name) as deputationBy,
      ts.createdAt
      FROM deputations ts
      left join branches b on b.branch_id = ts.from_place
      left join branches b2 on b2.branch_id = ts.to_place
      left join staffs s on s.staff_id = ts.staff_id 
      left join designation des on des.designation_id = s.designation_id 
      left join department dep on dep.department_id = s.department_id
      left join status_lists sur on sur.status_list_id = s.surname_id
      left join staffs s2 on s2.staff_id = ts.deputation_by ${iql}
      ORDER BY ts.deputation_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createDeputation(postData) {
  try {

    const countResult = await sequelize.query(`SELECT ts.deputation_code "deputationCode"
      FROM deputations ts ORDER BY ts.deputation_id DESC LIMIT 1`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const applicantCodeFormat = `K3-KRR-`
    const count = countResult.length > 0 ? parseInt(countResult[0].deputationCode.split("-").pop()) : `00000`
    postData.deputationCode = await generateSerialNumber(applicantCodeFormat, count)

    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.staff_id || false && excuteMethod?.deputation_date || false) {
      const existingDeputation = await sequelize.models.deputation.findOne({
        where: {
          staff_id: excuteMethod.staff_id, deputation_date: excuteMethod.deputation_date
        }
      });
      if (existingDeputation) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const deputationResult = await sequelize.models.deputation.create(excuteMethod);
    const req = {
      deputationId: deputationResult.deputation_id
    }
    return await getDeputation(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateDeputation(deputationId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.staff_id || false && excuteMethod?.deputation_date || false) {
      const duplicateDeputation = await sequelize.models.deputation.findOne({
        where: sequelize.literal(`staff_id = '${excuteMethod.staff_id}' AND deputation_date = '${excuteMethod.deputation_date}' AND deputation_id != '${deputationId}'`)
      });
      if (duplicateDeputation) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }
    const deputationResult = await sequelize.models.deputation.update(excuteMethod, { where: { deputation_id: deputationId } });
    const req = {
      deputationId: deputationId
    }
    return await getDeputation(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getDeputation,
  updateDeputation,
  createDeputation
};