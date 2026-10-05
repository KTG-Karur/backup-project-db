"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getSettingSalaryDeduction(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.settingDeductionId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.setting_deduction_id = ${query.settingDeductionId}`;
      }
    }
    const result = await sequelize.query(`SELECT 
      ts.setting_deduction_id "settingDeductionId",
      ts.is_percentage "isPercentage", 
      ts.is_deduction "isDeduction", 
      ts.is_increment "isIncrement", 
      CASE WHEN is_increment = 1 then "Increment"  ELSE "Including" END AS "isIncrementName", 
      CASE WHEN is_deduction = 1 then "Deduction"  ELSE "Allowance" END AS "isDeductionName", 
      CASE WHEN is_percentage = 1 then "Percentage"  ELSE "Amount" END AS "isPercentageName", 
      ts.deduction_value "deductionValue", 
      ts.deduction_name "deductionName",
      ts.is_active "isActive",
      ts.createdAt
      FROM setting_deductions ts ${iql}
      ORDER BY ts.setting_deduction_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createSettingSalaryDeduction(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const settingSalaryDeductionResult = await sequelize.models.setting_deduction.create(excuteMethod);
    const req = {
      settingDeductionId: settingSalaryDeductionResult.setting_deduction_id
    }
    return await getSettingSalaryDeduction(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateSettingSalaryDeduction(settingDeductionId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const settingSalaryDeductionResult = await sequelize.models.setting_deduction.update(excuteMethod, { where: { setting_deduction_id: settingDeductionId } });
    const req = {
      settingDeductionId: settingDeductionId
    }
    return await getSettingSalaryDeduction(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getSettingSalaryDeduction,
  updateSettingSalaryDeduction,
  createSettingSalaryDeduction
};