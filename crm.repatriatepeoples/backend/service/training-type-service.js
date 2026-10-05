"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getTrainingType(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.trainingTypeId) {
        iql.training_type_id = query.trainingTypeId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.training_types.findAll({
      attributes: [['training_type_id', 'trainingTypeId'], ['training_type_name', 'trainingTypeName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      order: [['training_type_id', 'DESC']],
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createTrainingType(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const trainingTypeResult = await sequelize.models.training_types.create(excuteMethod);
    const req = {
      trainingTypeId: trainingTypeResult.training_type_id
    }
    return await getTrainingType(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateTrainingType(trainingTypeId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const trainingTypeResult = await sequelize.models.training_types.update(excuteMethod, { where: { training_type_id: trainingTypeId } });
    const req = {
      trainingTypeId: trainingTypeId
    }
    return await getTrainingType(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getTrainingType,
  updateTrainingType,
  createTrainingType,
};