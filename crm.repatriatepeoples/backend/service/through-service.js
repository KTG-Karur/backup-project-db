"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getThrough(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.throughId) {
        iql.through_id = query.throughId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.through.findAll({
      attributes: [['through_id', 'throughId'], ['through_name', 'throughName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      order: [['through_id', 'DESC']],
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createThrough(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const throughResult = await sequelize.models.through.create(excuteMethod);
    const req = {
      throughId: throughResult.through_id
    }
    return await getThrough(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateThrough(throughId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const throughResult = await sequelize.models.through.update(excuteMethod, { where: { through_id: throughId } });
    const req = {
      throughId: throughId
    }
    return await getThrough(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getThrough,
  updateThrough,
  createThrough,
};