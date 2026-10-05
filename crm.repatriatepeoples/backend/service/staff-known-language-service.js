"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffKnownLanguage(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffKnownLanguageId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.staff_known_language_id = ${query.staffKnownLanguageId}`;
      }
    }
    const result = await sequelize.query(`SELECT staff_known_language_id "staffKnownLanguageId", staff_id "staffId",
        language_id "languageId",sl.status_name "languageName", language_speak "speak", language_read "read", language_write "write", skl.createdAt
        FROM staff_known_languages skl
        left join status_lists sl on sl.status_list_id = skl.language_id  ${iql}`, {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffKnownLanguage(postData) {
  try {
    const excuteMethod = _.map(postData, (item) => _.mapKeys(item, (value, key) => _.snakeCase(key)));
    const staffKnownLanguageResult = await sequelize.models.staff_known_language.bulkCreate(excuteMethod);
    return true;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffKnownLanguage(staffKnownLanguageId, putData) {
  try {
    if (putData.length > 0) {
      putData.map((item, index) => {
        const selectedId = item?.staffKnownLanguageId || 0
        item.staffId = staffKnownLanguageId
        const excuteMethod = _.mapKeys(item, (value, key) => _.snakeCase(key))
        if(selectedId > 0){
          const staffWorkExperienceResult = sequelize.models.staff_known_language.update(excuteMethod, { where: { staff_known_language_id: selectedId } });
        }else{
          const staffWorkExperienceResult = sequelize.models.staff_known_language.create(excuteMethod);
        }
      })
      return true;
    } else {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const staffKnownLanguageResult = await sequelize.models.staff_known_language.update(excuteMethod, { where: { staff_known_language_id: staffKnownLanguageId } });
    const req = {
      staffKnownLanguageId: staffKnownLanguageId
    }
    return await getStaffKnownLanguage(req);
  }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

async function deleteStaffKnownLanguage(staffKnownLanguageId) {
  try {
    const staffProofResult = await sequelize.models.staff_known_language.destroy({ where: { staff_known_language_id: staffKnownLanguageId } });
    if(staffProofResult == 1){
      return "Deleted Successfully...!";
    }else{
      return "Data Not Founded...!";
    }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

module.exports = {
  getStaffKnownLanguage,
  updateStaffKnownLanguage,
  createStaffKnownLanguage,
  deleteStaffKnownLanguage
};