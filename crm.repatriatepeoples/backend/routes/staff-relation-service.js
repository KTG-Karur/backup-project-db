"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffRelationServices = require("../service/staff-relation-service");
const _ = require('lodash');

const schema = {
//   staffRelationName: { type: "string", optional: false, min:1, max: 100 }
}

async function getStaffRelation(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffRelationServices.getStaffRelation(req.query);
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

async function createStaffRelation(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
    responseEntries.data = await staffRelationServices.createStaffRelation(req.body);
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

async function updateStaffRelation(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
      responseEntries.data = await staffRelationServices.updateStaffRelation(req.params.staffRelationId, req.body);
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

async function deleteStaffRelation(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffRelationServices.deleteStaffRelation(req.params.staffRelationId);
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
    url: '/staff-relation',
    preHandler: verifyToken,
    handler: getStaffRelation
  });

  fastify.route({
    method: 'POST',
    url: '/staff-relation',
    preHandler: verifyToken,
    handler: createStaffRelation
  });

  fastify.route({
    method: 'PUT',
    url: '/staff-relation/:staffRelationId',
    preHandler: verifyToken,
    handler: updateStaffRelation
  });

  fastify.route({
    method: 'DELETE',
    url: '/staff-relation/:staffRelationId',
    preHandler: verifyToken,
    handler: deleteStaffRelation
  });
};