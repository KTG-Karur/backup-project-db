"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffProofServices = require("../service/staff-proof-id-service");
const _ = require('lodash');

const schema = {
//   staffProofName: { type: "string", optional: false, min:1, max: 100 }
}

async function getStaffProof(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffProofServices.getStaffProof(req.query);
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

async function createStaffProof(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
    responseEntries.data = await staffProofServices.createStaffProof(req.body);
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

async function updateStaffProof(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
      responseEntries.data = await staffProofServices.updateStaffProof(req.params.staffProofId, req.body);
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

async function deleteStaffProof(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffProofServices.deleteStaffProof(req.params.staffProofId);
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
    url: '/staff-proof',
    preHandler: verifyToken,
    handler: getStaffProof
  });

  fastify.route({
    method: 'POST',
    url: '/staff-proof',
    preHandler: verifyToken,
    handler: createStaffProof
  });

  fastify.route({
    method: 'PUT',
    url: '/staff-proof/:staffProofId',
    preHandler: verifyToken,
    handler: updateStaffProof
  });

  fastify.route({
    method: 'DELETE',
    url: '/staff-proof/:staffProofId',
    preHandler: verifyToken,
    handler: deleteStaffProof
  });
};