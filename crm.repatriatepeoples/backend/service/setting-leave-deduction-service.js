"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getSettingLeaveDeduction(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.settingLeaveDeductionId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.setting_leave_deduction_id = ${query.settingLeaveDeductionId}`;
      }
    }
    const result = await sequelize.query(`SELECT ts.setting_leave_deduction_id "settingLeaveDeductionId",ts.leave_deduction_value "leaveDeductionPercentage", ts.leave_type_id "leaveTypeId", sl.status_name "leaveTypeName", ts.leave_count_day "leaveCountDay",ts.createdAt FROM setting_leave_deductions ts left join status_lists sl on sl.status_list_id = ts.leave_type_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createSettingLeaveDeduction(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const settingLeaveDeductionResult = await sequelize.models.setting_leave_deduction.create(excuteMethod);
    const req = {
      settingLeaveDeductionId: settingLeaveDeductionResult.setting_leave_deduction_id
    }
    return await getSettingLeaveDeduction(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateSettingLeaveDeduction(settingLeaveDeductionId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const settingLeaveDeductionResult = await sequelize.models.setting_leave_deduction.update(excuteMethod, { where: { setting_leave_deduction_id: settingLeaveDeductionId } });
    const req = {
      settingLeaveDeductionId: settingLeaveDeductionId
    }
    return await getSettingLeaveDeduction(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getSettingLeaveDeduction,
  updateSettingLeaveDeduction,
  createSettingLeaveDeduction
};