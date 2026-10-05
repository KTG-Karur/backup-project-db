"use strict";

const Validator = require("fastest-validator");
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffWorkExperienceServices = require("../service/staff-work-experience-service");
const _ = require("lodash");

const schema = {
  // staffWorkExperienceName: { type: "string", optional: false, min: 1, max: 100 }
};

async function getStaffWorkExperience(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data =
      await staffWorkExperienceServices.getStaffWorkExperience(req.query);
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

async function createStaffWorkExperience(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validationResponse = await v.validate(req.body, schema);
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data =
        await staffWorkExperienceServices.createStaffWorkExperience(req.body);
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

async function updateStaffWorkExperience(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema);
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data =
        await staffWorkExperienceServices.updateStaffWorkExperience(
          req.params.staffWorkExperienceId,
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

async function deleteStaffWorkExperience(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data =
      await staffWorkExperienceServices.deleteStaffWorkExperience(
        req.params.staffWorkExperienceId
      );
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
    method: "GET",
    url: "/work-experience",
    preHandler: verifyToken,
    handler: getStaffWorkExperience,
  });

  fastify.route({
    method: "POST",
    url: "/work-experience",
    preHandler: verifyToken,
    handler: createStaffWorkExperience,
  });

  fastify.route({
    method: "PUT",
    url: "/work-experience/:staffWorkExperienceId",
    preHandler: verifyToken,
    handler: updateStaffWorkExperience,
  });

  fastify.route({
    method: "DELETE",
    url: "/work-experience/:staffWorkExperienceId",
    preHandler: verifyToken,
    handler: deleteStaffWorkExperience,
  });
};
