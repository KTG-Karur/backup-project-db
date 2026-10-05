"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const permissionServices = require("../service/permission-service");
const _ = require('lodash');

const schema = {
  staffId: "number|required|integer|positive",
  permissionTypeId: "number|required|integer|positive",
}

async function getPermission(req, res) {
  const responseEntries = new ResponseEntry();
  let user = req.user;
  if (user.roleName && user.roleName !== 'Super Admin') {
      if(!user.permissionFlag)
      req.query.staffId = user.staffId;
    
  }
  try {
    responseEntries.data = await permissionServices.getPermission(req.query);
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

async function createPermission(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
    responseEntries.data = await permissionServices.createPermission(req.body);
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

async function updatePermission(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
      responseEntries.data = await permissionServices.updatePermission(req.params.permissionId, req.body);
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

module.exports = async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/permission',
    preHandler: verifyToken,
    handler: getPermission
  });

  fastify.route({
    method: 'POST',
    url: '/permission',
    preHandler: verifyToken,
    handler: createPermission
  });

  fastify.route({
    method: 'PUT',
    url: '/permission/:permissionId',
    preHandler: verifyToken,
    handler: updatePermission
  });
};