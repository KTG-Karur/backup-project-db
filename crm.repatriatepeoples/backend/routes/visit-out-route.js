"use strict";

const Validator = require('fastest-validator');
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const visitOutService = require("../service/visit-out-service");

const visitOutSchema = {
  visitOutLatitude:  { type: "number", optional: false },
  visitOutLongitude: { type: "number", optional: false },
  mobileModel:       { type: "string", optional: true },
  batteryLevel:      { type: "string", optional: true }
};

const gpsTrailSchema = {
  latitude:     { type: "number", optional: false },
  longitude:    { type: "number", optional: false },
  batteryLevel: { type: "string", optional: true },
  speed:        { type: "number", optional: true },
  accuracy:     { type: "number", optional: true },
  recordedAt:   { type: "string", optional: true }
};

async function submitVisitOut(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validation = v.validate(req.body, visitOutSchema);
    if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

    responseEntries.data = await visitOutService.submitVisitOut(req.params.entryLogId, req.body);
    if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message || error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function recordVisitGpsTrail(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validation = v.validate(req.body, gpsTrailSchema);
    if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

    responseEntries.data = await visitOutService.recordVisitGpsTrail(req.params.entryLogId, req.body);
    if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message || error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

module.exports = async function (fastify) {
  fastify.route({
    method: 'POST',
    url: '/visit-out/:entryLogId',
    handler: submitVisitOut
  });

  fastify.route({
    method: 'POST',
    url: '/visit-gps-trail/:entryLogId',
    handler: recordVisitGpsTrail
  });
};
