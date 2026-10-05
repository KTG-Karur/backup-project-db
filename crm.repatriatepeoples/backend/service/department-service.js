"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getDepartment(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.departmentId) {
        iql.department_id = query.departmentId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.department.findAll({
      attributes: [['department_id', 'departmentId'], ['department_name', 'departmentName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      order: [['department_id', 'DESC']],
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createDepartment(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.department_name || false) {
      const existingDepartment = await sequelize.models.department.findOne({
        where: {
          department_name: excuteMethod.department_name
        }
      });
      if (existingDepartment) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }
    const departmentResult = await sequelize.models.department.create(excuteMethod);
    const req = {
      departmentId: departmentResult.department_id
    }
    return await getDepartment(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateDepartment(departmentId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.department_name || false) {
      const duplicateDepartment = await sequelize.models.department.findOne({
        where: sequelize.literal(`department_id != '${excuteMethod.department_id}' AND department_name = '${excuteMethod.department_name}'`)
      });
      if (duplicateDepartment) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const departmentResult = await sequelize.models.department.update(excuteMethod, { where: { department_id: departmentId } });
    const req = {
      departmentId: departmentId
    }
    return await getDepartment(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getDepartment,
  updateDepartment,
  createDepartment,
};