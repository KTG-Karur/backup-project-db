"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffRelation(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffRelationId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.staff_relation_details_id = ${query.staffRelationDetailsId}`;
      }
    }
    const result = await sequelize.query(`SELECT staff_relation_details_id "staff_relationDetailsId", staff_id "staffId", 
        relation_id "relationId", contact_no "contactNo", relation_dob "relationDob",
        qualification_id "qualificationId", occupation, createdAt, relation_name "relationName"
        FROM staff_relation_details ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffRelation(postData) {
  try {
    const excuteMethod = _.map(postData, (item) => _.mapKeys(item, (value, key) => _.snakeCase(key)));
    const staffRelationResult = await sequelize.models.staff_relation_details.bulkCreate(excuteMethod);
    return true
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffRelation(staffRelationId, putData) {
  try {
    if (putData.length > 0) {
      putData.map((item, index) => {
        const selectedId = item?.staffRelationDetailsId || 0
        item.staffId = staffRelationId
        const excuteMethod = _.mapKeys(item, (value, key) => _.snakeCase(key))
        if(selectedId > 0){
          const staffRelationResult = sequelize.models.staff_relation_details.update(excuteMethod, { where: { staff_relation_details_id: selectedId } });
        }else{
          const staffRelationResult = sequelize.models.staff_relation_details.create(excuteMethod);
        }
      })
      return true;
    } else {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
      const staffRelationResult = await sequelize.models.staff_relation_details.update(excuteMethod, { where: { staff_relation_details_id: staffRelationId } });
      const req = {
        staffRelationId: staffRelationId
      }
      return await getStaffRelation(req);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaffRelation(staffRelationId) {
  try {
    const staffRelationResult = await sequelize.models.staff_relation_details.destroy({ where: { staff_relation_details_id: staffRelationId } });
    if(staffRelationResult == 1){
      return "Deleted Successfully...!";
    }else{
      return "Data Not Founded...!";
    }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}
module.exports = {
  getStaffRelation,
  updateStaffRelation,
  deleteStaffRelation,
  createStaffRelation
};