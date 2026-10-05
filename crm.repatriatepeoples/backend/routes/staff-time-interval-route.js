"use strict";
const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffTimeIntervalServices = require("../service/staff-time-interval-service");
const _ = require('lodash');

const schema = {
  staffId: { type: "number", optional: false },
  timeStatus: { type: "number", optional: false },
  attendanceMarkType: { type: "number", optional: true },
  status: { type: "number", optional: true },
  attendanceType: { type: "number", optional: true },
  address: { type: "string", optional: true, max: 500 },
  latitude: { type: "string", optional: true },
  longitude: { type: "string", optional: true }
}

async function getStaffTimeIntervals(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffTimeIntervalServices.getStaffTimeIntervals(req.query);
    if (!responseEntries.data || responseEntries.data.length === 0) 
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function getStaffTimeIntervalDetails(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffTimeIntervalServices.getStaffTimeIntervalDetails(req.query);
    if (!responseEntries.data) 
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function createStaffTimeInterval(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffTimeIntervalServices.createStaffTimeInterval(req.body);
      if (!responseEntries.data) 
        responseEntries.message = messages.DATA_NOT_FOUND;
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

async function updateStaffTimeInterval(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffTimeIntervalServices.updateStaffTimeInterval(req.params.intervalId, req.body);
      if (!responseEntries.data) 
        responseEntries.message = messages.DATA_NOT_FOUND;
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

async function deleteStaffTimeInterval(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffTimeIntervalServices.deleteStaffTimeInterval(req.params.intervalId);
    if (!responseEntries.data) 
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = error.code ? error.code : responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

module.exports = async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/staff-time-intervals',
    preHandler: verifyToken,
    handler: getStaffTimeIntervals
  });
  
  fastify.route({
    method: 'GET',
    url: '/staff-time-interval-details',
    preHandler: verifyToken,
    handler: getStaffTimeIntervalDetails
  });
  
  fastify.route({
    method: 'POST',
    url: '/staff-time-interval',
    preHandler: verifyToken,
    handler: createStaffTimeInterval
  });
  
  fastify.route({
    method: 'PUT',
    url: '/staff-time-interval/:intervalId',
    preHandler: verifyToken,
    handler: updateStaffTimeInterval
  });
  
  fastify.route({
    method: 'DELETE',
    url: '/staff-time-interval/:intervalId',
    preHandler: verifyToken,
    handler: deleteStaffTimeInterval
  });
};