"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getActivity(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.activityId) {
        iql.activity_id = query.activityId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.activity.findAll({
      attributes: [['activity_id', 'activityId'], ['activity_name', 'activityName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      order: [['activity_id', 'DESC']],
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createActivity(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const activityResult = await sequelize.models.activity.create(excuteMethod);
    const req = {
      activityId: activityResult.activity_id
    }
    return await getActivity(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateActivity(activityId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const activityResult = await sequelize.models.activity.update(excuteMethod, { where: { activity_id: activityId } });
    const req = {
      activityId: activityId
    }
    return await getActivity(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getActivity,
  updateActivity,
  createActivity,
};