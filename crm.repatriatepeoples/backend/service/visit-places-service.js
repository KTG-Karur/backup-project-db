"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');

async function getVisitPlaces(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.visitPlacesId) {
        iql.visit_places_id = query.visitPlacesId;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.visit_places.findAll({
      attributes: [['visit_places_id', 'visitPlacesId'], ['visit_places_name', 'visitPlacesName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      order: [['visit_places_id', 'DESC']],
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createVisitPlaces(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const visitPlacesResult = await sequelize.models.visit_places.create(excuteMethod);
    const req = {
      visitPlacesId: visitPlacesResult.visit_places_id
    }
    return await getVisitPlaces(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateVisitPlaces(visitPlacesId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const visitPlacesResult = await sequelize.models.visit_places.update(excuteMethod, { where: { visit_places_id: visitPlacesId } });
    const req = {
      visitPlacesId: visitPlacesId
    }
    return await getVisitPlaces(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getVisitPlaces,
  updateVisitPlaces,
  createVisitPlaces,
};