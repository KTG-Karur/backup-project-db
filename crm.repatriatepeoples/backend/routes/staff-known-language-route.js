"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffKnownLanguageServices = require("../service/staff-known-language-service");
const _ = require('lodash');

const schema = {
//   staffKnownLanguageName: { type: "string", optional: false, min:1, max: 100 }
}

async function getStaffKnownLanguage(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffKnownLanguageServices.getStaffKnownLanguage(req.query);
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

async function createStaffKnownLanguage(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
    responseEntries.data = await staffKnownLanguageServices.createStaffKnownLanguage(req.body);
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

async function updateStaffKnownLanguage(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
      responseEntries.data = await staffKnownLanguageServices.updateStaffKnownLanguage(req.params.staffKnownLanguageId, req.body);
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

async function deleteStaffKnownLanguage(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffKnownLanguageServices.deleteStaffKnownLanguage(req.params.staffKnownLanguageId);
    if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
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
    url: '/staff-known-language',
    preHandler: verifyToken,
    handler: getStaffKnownLanguage
  });

  fastify.route({
    method: 'POST',
    url: '/staff-known-language',
    preHandler: verifyToken,
    handler: createStaffKnownLanguage
  });

  fastify.route({
    method: 'PUT',
    url: '/staff-known-language/:staffKnownLanguageId',
    preHandler: verifyToken,
    handler: updateStaffKnownLanguage
  });

  fastify.route({
    method: 'DELETE',
    url: '/staff-known-language/:staffKnownLanguageId',
    preHandler: verifyToken,
    handler: deleteStaffKnownLanguage
  });
};