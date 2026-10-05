"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffAchievement(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffAchievementId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` staff_achievement_id = ${query.staffAchievementId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` staff_id = ${query.staffId}`;
      }
    }
    const result = await sequelize.query(`SELECT staff_achievement_id "staffAchievementId", staff_id "staffId",
        achievement_at_id "achievementAtId",achievement_title_id "achievementTitleId", achievement_details "achievementDetails",createdAt
        FROM staff_achievements ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffAchievement(postData) {
  try {
    const excuteMethod = _.map(postData, (item) => _.mapKeys(item, (value, key) => _.snakeCase(key)));
    const staffAchievementResult = await sequelize.models.staff_achievements.bulkCreate(excuteMethod);
    return true;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffAchievement(staffAchievementId, putData) {
  try {
    if (putData.length > 0) {
      putData.map((item, index) => {
        const selectedId = item?.staffAchievementId || 0
        item.staffId = staffAchievementId
        const excuteMethod = _.mapKeys(item, (value, key) => _.snakeCase(key))
        if (selectedId > 0) {

        } else {
          const staffWorkExperienceResult = sequelize.models.staff_achievements.create(excuteMethod);
        }
      })
      return true;
    } else {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
      const staffAchievementResult = await sequelize.models.staff_achievements.update(excuteMethod, { where: { staff_achievement_id: staffAchievementId } });
      const req = {
        staffAchievementId: staffAchievementId
      }
      return await getStaffAchievement(req);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaffAchievement(staffAchievementId) {
  try {
    const staffProofResult = await sequelize.models.staff_achievements.destroy({ where: { staff_achievement_id: staffAchievementId } });
    if (staffProofResult == 1) {
      return "Deleted Successfully...!";
    } else {
      return "Data Not Founded...!";
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffAchievement,
  updateStaffAchievement,
  createStaffAchievement,
  deleteStaffAchievement
};