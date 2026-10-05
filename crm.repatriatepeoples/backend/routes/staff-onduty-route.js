"use strict";

const Validator = require("fastest-validator");
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffOnDutyServices = require("../service/staff-onduty-service");
const _ = require("lodash");

const schema = {
  // staffOnDutyName: { type: "string", optional: false, min: 1, max: 100 }
};

async function getStaffOnDuty(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffOnDutyServices.getStaffOnDuty(req.query);
    if (!responseEntries.data)
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function createStaffOnDuty(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validationResponse = await v.validate(req.body, schema);
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffOnDutyServices.createStaffOnDuty(
        req.body
      );
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

async function updateStaffOnDuty(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema);
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffOnDutyServices.updateStaffOnDuty(
        req.params.staffOnDutyId,
        req.body
      );
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

module.exports = async function (fastify) {
  fastify.route({
    method: "GET",
    url: "/staff-onduty",
    preHandler: verifyToken,
    handler: getStaffOnDuty,
  });

  fastify.route({
    method: "POST",
    url: "/staff-onduty",
    preHandler: verifyToken,
    handler: createStaffOnDuty,
  });

  fastify.route({
    method: "PUT",
    url: "/staff-onduty/:staffOnDutyId",
    preHandler: verifyToken,
    handler: updateStaffOnDuty,
  });
};
