"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getStaffTraining(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffTrainingId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.staff_training_id = ${query.staffTrainingId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
      // if (query.fromPlace) {
      //   iql += count >= 1 ? ` AND` : ``;
      //   count++;
      //   iql += ` ts.from_place = ${query.fromPlace}`;
      // }
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
    }
    const result = await sequelize.query(`SELECT ts.staff_training_id "staffTrainingId",
       s.staff_profile_image_name AS "staffProfile",
       s.staff_code AS "staffCode",
      ts.staff_id "staffId",CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName,
      ts.staff_training_code "staffTrainingCode", ts.staff_training_date "staffTrainingDate", ts.status_id "statusId",
      des.designation_name 'designationName',  dep.department_name 'departmentName',
      ts.from_date "fromDate", ts.to_date "toDate", b.branch_id "fromPlace", b2.branch_id "toPlace",
      b.branch_name "fromPlaceName", b2.branch_name "toPlaceName", ts.reason "reason",ts.staff_training_by "staff_trainingById",CONCAT(s.first_name,' ',s.last_name) as staff_trainingBy,
      ts.createdAt
      FROM staff_trainings ts
      left join branches b on b.branch_id = ts.from_place
      left join branches b2 on b2.branch_id = ts.to_place
      left join staffs s on s.staff_id = ts.staff_id 
      left join designation des on des.designation_id = s.designation_id 
      left join department dep on dep.department_id = s.department_id
      left join status_lists sur on sur.status_list_id = s.surname_id
      left join staffs s2 on s2.staff_id = ts.staff_training_by ${iql}
       ORDER BY ts.staff_training_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffTraining(postData) {
  try {

    const countResult = await sequelize.query(`SELECT ts.staff_training_code "staff_trainingCode"
      FROM staff_trainings ts ORDER BY ts.staff_training_id DESC LIMIT 1`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    const applicantCodeFormat = `K3-KRR-`
    const count = countResult.length > 0 ? parseInt(countResult[0].staff_trainingCode.split("-").pop()) : `00000`
    postData.staffTrainingCode = await generateSerialNumber(applicantCodeFormat, count)

    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.staff_training_date || false && excuteMethod?.staff_id || false) {
      const existingStaffTraining = await sequelize.models.staff_training.findOne({
        where: {
          staff_id: excuteMethod.staff_id, staff_training_date: sequelize.where(
            sequelize.fn('DATE', sequelize.col('staff_training_date')),
            excuteMethod.staff_training_date
          )
        }
      });
      if (existingStaffTraining) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const staffTrainingResult = await sequelize.models.staff_training.create(excuteMethod);
    const req = {
      staffTrainingId: staffTrainingResult.staff_training_id
    }
    return await getStaffTraining(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffTraining(staffTrainingId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.staff_training_date || false && excuteMethod?.staff_id || false) {
      const duplicateStaffTraining = await sequelize.models.staff_training.findOne({
        where: sequelize.literal(`staff_id = '${excuteMethod.staff_id}' AND staff_training_date = '${excuteMethod.staff_training_date}' AND staff_training_id != '${staffTrainingId}'`)
      });
      if (duplicateStaffTraining) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }
    const staff_trainingResult = await sequelize.models.staff_training.update(excuteMethod, { where: { staff_training_id: staffTrainingId } });
    const req = {
      staffTrainingId: staffTrainingId
    }
    return await getStaffTraining(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffTraining,
  updateStaffTraining,
  createStaffTraining
};