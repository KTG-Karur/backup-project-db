"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getAdvancePaymentHistory(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffAdvanceId) { 
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.staff_advance_id = ${query.staffAdvanceId}`;
      }
      if (query.advancePaymentHistoryId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.advance_payment_history_id = ${query.advancePaymentHistoryId}`;
      }
    }
    const result = await sequelize.query(`SELECT 
    ts.advance_payment_history_id AS "advancePaymentHistoryId",
    sa.staff_id AS "staffId",
    ts.staff_advance_id AS "staffAdvanceId",
    ts.paid_date AS "paidDate",
    ts.paid_amount AS "paidAmount",
    acc.account_name AS "accountName",
    ts.account_id AS "accountId",
    ts.through_id AS "throughId",
    th.through_name AS "throughName",
    ts.description AS "description",
    ts.paid_to AS "paidTo",
    ts.is_active AS "isActive",
    ts.createdAt
FROM 
    advance_payment_histories ts
LEFT JOIN 
    staff_advances sa ON sa.staff_advance_id = ts.staff_advance_id
LEFT JOIN 
    throughs th ON th.through_id = ts.through_id
LEFT JOIN 
    accounts acc ON acc.account_id = ts.account_id ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createAdvancePaymentHistory(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const advancePaymentHistoryResult = await sequelize.models.advance_payment_history.create(excuteMethod);
    const req = {
      advancePaymentHistoryId: advancePaymentHistoryResult.advance_payment_history_id
    }
    return await getAdvancePaymentHistory(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateAdvancePaymentHistory(advancePaymentHistoryId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const advancePaymentHistoryResult = await sequelize.models.advance_payment_history.update(excuteMethod, { where: { advance_payment_history_id: advancePaymentHistoryId } });
    const req = {
      advancePaymentHistoryId: advancePaymentHistoryId
    }
    return await getAdvancePaymentHistory(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getAdvancePaymentHistory,
  updateAdvancePaymentHistory,
  createAdvancePaymentHistory
};