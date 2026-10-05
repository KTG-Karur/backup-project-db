"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getAccount(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.accountId) {
        iql.account_id = query.accountId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.account.findAll({
      attributes: [['account_id', 'accountId'], ['account_name', 'accountName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      order: [['account_id', 'DESC']],
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createAccount(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const accountResult = await sequelize.models.account.create(excuteMethod);
    const req = {
      accountId: accountResult.account_id
    }
    return await getAccount(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateAccount(accountId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const accountResult = await sequelize.models.account.update(excuteMethod, { where: { account_id: accountId } });
    const req = {
      accountId: accountId
    }
    return await getAccount(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getAccount,
  updateAccount,
  createAccount,
};