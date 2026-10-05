"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const userServices = require("../service/user-service");
const { decrptPassword } = require('../utils/utility');

async function getSettings(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.settingsId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` stg.settings_id = ${query.settingsId}`;
      }
    }
    const result = await sequelize.query(`SELECT stg.settings_id "settingsId", 
      company_name "companyName",company_mobile "companyMobile",company_district "companyDistrict",company_state "companyState",company_alt_mobile "companyAltMobile",company_mail "companyMail",company_gst_no "companyGstNo",company_address "companyAddress",company_pincode "companyPincode",company_logo "companyLogo",
      stg.createdAt "createAt", stg.updatedAt "updatedAt"
        FROM settings as stg
        ${iql} ORDER BY settings_id DESC `, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    console.log(error)
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateSettings(settingsId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    console.log(excuteMethod)
    const settingsResult = await sequelize.models.setting.update(excuteMethod, { where: { settings_id: settingsId } });

    const req = {
      settingsId: settingsId
    }
    return await getSettings(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getSettings,
  updateSettings,
};