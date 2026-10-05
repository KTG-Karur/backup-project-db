"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffQualificationServices = require("../service/staff-qualification-service");
const _ = require('lodash');

const schema = {
    // staffQualificationName: { type: "string", optional: false, min: 1, max: 100 }
}

async function getStaffQualification(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffQualificationServices.getStaffQualification(req.query);
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

async function createStaffQualification(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffQualificationServices.createStaffQualification(req.body);
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

async function updateStaffQualification(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffQualificationServices.updateStaffQualification(req.params.staffQualificationId, req.body);
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

async function deleteStaffQualification(req, res) {
    const responseEntries = new ResponseEntry();
    try {
      responseEntries.data = await staffQualificationServices.deleteStaffQualification(req.params.staffQualificationId);
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
        url: '/staff-qualification',
        preHandler: verifyToken,
        handler: getStaffQualification
    });

    fastify.route({
        method: 'POST',
        url: '/staff-qualification',
        preHandler: verifyToken,
        handler: createStaffQualification
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-qualification/:staffQualificationId',
        preHandler: verifyToken,
        handler: updateStaffQualification
    });

    fastify.route({
        method: 'DELETE',
        url: '/staff-qualification/:staffQualificationId',
        preHandler: verifyToken,
        handler: deleteStaffQualification
      });
};