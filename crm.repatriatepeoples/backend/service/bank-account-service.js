"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getBankAccount(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.bankAccountId) {
        iql.bank_account_id = query.bankAccountId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.bank_account.findAll({
      attributes: [['bank_account_id', 'bankAccountId'],
      ['account_holder_name', 'accountHolderName'],
      ['bank_name', 'bankName'],
      [sequelize.literal(`CONCAT(bank_name, ' - ', branch_name)`), 'bankAndBranch'],
      ['branch_name', 'branchName'],
      ['account_no', 'accountNo'],
      ['ifsc_code', 'ifscCode'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createBankAccount(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const bankAccountResult = await sequelize.models.bank_account.create(excuteMethod);
    const req = {
      bankAccountId: bankAccountResult.bank_account_id
    }
    return await getBankAccount(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateBankAccount(bankAccountId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const bankAccountResult = await sequelize.models.bank_account.update(excuteMethod, { where: { bank_account_id: bankAccountId } });
    const req = {
      bankAccountId: bankAccountId
    }
    return await getBankAccount(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteBankAccount(bankAccountId) {
  try {
    const bankAccountResult = await sequelize.models.bankAccount.destroy({ where: { bank_account_id: bankAccountId } });
    if (bankAccountResult == 1) {
      return "Deleted Successfully...!";
    } else {
      return "Data Not Founded...!";
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getBankAccount,
  updateBankAccount,
  createBankAccount,
  deleteBankAccount
};