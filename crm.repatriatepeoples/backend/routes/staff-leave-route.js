"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffLeaveServices = require("../service/staff-leave-service");
const _ = require('lodash');

const schema = {
    // staffLeaveName: { type: "string", optional: false, min: 1, max: 100 }
}

async function getStaffLeave(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffLeaveServices.getStaffLeave(req.query);
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error = true;
        responseEntries.message = error;
        responseEntries.code = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

async function getStaffRemainingLeave(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffLeaveServices.getStaffRemainingLeave(req.query);
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error = true;
        responseEntries.message = error;
        responseEntries.code = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

async function createStaffLeave(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffLeaveServices.createStaffLeave(req.body);
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

async function updateStaffLeave(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffLeaveServices.updateStaffLeave(req.params.staffLeaveId, req.body, req.user);
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
        url: '/staff-leave',
        preHandler: verifyToken,
        handler: getStaffLeave
    });
    fastify.route({
        method: 'GET',
        url: '/staff-remaining-leave',
        preHandler: verifyToken,
        handler: getStaffRemainingLeave
    });

    fastify.route({
        method: 'POST',
        url: '/staff-leave',
        preHandler: verifyToken,
        handler: createStaffLeave
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-leave/:staffLeaveId',
        preHandler: verifyToken,
        handler: updateStaffLeave
    });
};