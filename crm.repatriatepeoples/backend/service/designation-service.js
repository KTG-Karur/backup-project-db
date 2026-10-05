"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getDesignation(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.designationId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.designation_id = ${query.designationId}`;
      }
      if (query.departmentId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.department_id = ${query.departmentId}`;
      }
      if (query.isActive) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.is_active = ${query.isActive}`;
      }
    }
    const result = await sequelize.query(`SELECT de.designation_id "designationId", de.department_id "departmentId",d.department_name "departmentName",
        de.designation_name "designationName", de.is_active "isActive", de.createdAt, de.updatedAt
        FROM designation de
        left join department d on d.department_id = de.department_id ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createDesignation(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.name || false) {
      const existingDesignation = await sequelize.models.designation.findOne({
        where: {
          name: excuteMethod.name
        }
      });
      if (existingDesignation) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }
    const designationResult = await sequelize.models.designation.create(excuteMethod);
    const req = {
      designationId: designationResult.designation_id
    }
    return await getDesignation(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateDesignation(designationId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.name || false) {
      const existingDesignation = await sequelize.models.designation.findOne({
        where: {
          name: excuteMethod.name
        }
      });
      if (existingDesignation) {
        throw new Error(error.message ? error.message : messages.DUPLICATE_ENTRY);
      }
    }
    const designationResult = await sequelize.models.designation.update(excuteMethod, { where: { designation_id: designationId } });
    const req = {
      designationId: designationId
    }
    return await getDesignation(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getDesignation,
  updateDesignation,
  createDesignation
};