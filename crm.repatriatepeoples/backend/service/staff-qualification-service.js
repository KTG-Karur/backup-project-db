"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffQualification(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffQualificationId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` staff_qualification_id = ${query.staffQualificationId}`;
      }
    }
    const result = await sequelize.query(`SELECT staff_qualification_id "staffQualificationId", staff_id "staffId",
        qualification_id "qualificationId", passing_year "passingYear", university_name "universityName",
        percentage, stream, createdAt, updatedAt
        FROM staff_qualifications ${iql}`, {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffQualification(postData) {
  try {
    const excuteMethod = _.map(postData, (item) => _.mapKeys(item, (value, key) => _.snakeCase(key)));
    const staffQualificationResult = await sequelize.models.staff_qualification.bulkCreate(excuteMethod);
    return true;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffQualification(staffQualificationId, putData) {
  try {
    if (putData.length > 0) {
      putData.map((item, index) => {
        const selectedId = item?.staffQualificationId || 0
        item.staffId = staffQualificationId
        const excuteMethod = _.mapKeys(item, (value, key) => _.snakeCase(key))
        if(selectedId > 0){
          const staffQualificationResult = sequelize.models.staff_qualification.update(excuteMethod, { where: { staff_qualification_id: selectedId } });
        }else{
          const staffQualificationResult = sequelize.models.staff_qualification.create(excuteMethod);
        }
      })
      return true;
    } else {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const staffQualificationResult = await sequelize.models.staff_qualification.update(excuteMethod, { where: { staff_qualification_id: staffQualificationId } });
    const req = {
      staffQualificationId: staffQualificationId
    }
    return await getStaffQualification(req);
  }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

async function deleteStaffQualification(staffQualificationId) {
  try {
    const staffQualificationResult = await sequelize.models.staff_qualification.destroy({ where: { staff_qualification_id: staffQualificationId } });
    if(staffQualificationResult == 1){
      return "Deleted Successfully...!";
    }else{
      return "Data Not Founded...!";
    }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

module.exports = {
  getStaffQualification,
  updateStaffQualification,
  createStaffQualification,
  deleteStaffQualification
};