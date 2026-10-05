"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffRights(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffRightsId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` staff_rights_id = ${query.staffRightsId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` staff_id = ${query.staffId}`;
      }
    }
    const result = await sequelize.query(`SELECT staff_rights_id as "staffRightsId",staff_rights_permission as "staffRightsPermission",staff_id "staffId",createdAt "createdAt" FROM staff_rights ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffRights(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const staffRightsResult = await sequelize.models.staff_rights.create(excuteMethod);  
    const req = {
      staffRightsId: staffRightsResult.staff_rights_id
    }
    return await getStaffRights(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffRights(staffRightsId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const staffRightsResult = await sequelize.models.staff_rights.update(excuteMethod, { where: { staff_rights_id: staffRightsId } });
    const req = {
      staffRightsId: staffRightsId
    }
    return await getStaffRights(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffRights,
  updateStaffRights,
  createStaffRights,
};