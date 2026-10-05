"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffAchievementServices = require("../service/staff-achievement-service");
const _ = require('lodash');

const schema = {
  //   staffAchievementName: { type: "string", optional: false, min:1, max: 100 }
}

async function getStaffAchievement(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffAchievementServices.getStaffAchievement(req.query);
    if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function createStaffAchievement(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffAchievementServices.createStaffAchievement(req.body);
      if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function updateStaffAchievement(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffAchievementServices.updateStaffAchievement(req.params.staffAchievementId, req.body);
      if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = error.code ? error.code : responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function deleteStaffAchievement(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffAchievementServices.deleteStaffAchievement(req.params.staffAchievementId);
    if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = error.code ? error.code : responseCode.BAD_REQUEST;
  } finally {
    res.send(responseEntries);
  }
}

module.exports = async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/staff-achievement',
    preHandler: verifyToken,
    handler: getStaffAchievement
  });

  fastify.route({
    method: 'POST',
    url: '/staff-achievement',
    preHandler: verifyToken,
    handler: createStaffAchievement
  });

  fastify.route({
    method: 'PUT',
    url: '/staff-achievement/:staffAchievementId',
    preHandler: verifyToken,
    handler: updateStaffAchievement
  });

  fastify.route({
    method: 'DELETE',
    url: '/staff-achievement/:staffAchievementId',
    preHandler: verifyToken,
    handler: deleteStaffAchievement
  });
};