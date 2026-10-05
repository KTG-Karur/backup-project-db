"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffAdvanceServices = require("../service/staff-advance-service");
const _ = require('lodash');

const schema = {
    staffId: "number|required|integer|positive",
    amount: { type: "string", optional: false },
}

async function getStaffAdvance(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffAdvanceServices.getStaffAdvance(req.query);
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

async function getStaffAdvanceLedger(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffAdvanceServices.getStaffAdvanceLedger(req.query);
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

async function createStaffAdvance(req, res) {

    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)

        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffAdvanceServices.createStaffAdvance(req.body);
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

async function updateStaffAdvance(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffAdvanceServices.updateStaffAdvance(req.params.staffAdvanceId, req.body);
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
        url: '/staff-advance',
        preHandler: verifyToken,
        handler: getStaffAdvance
    });

    fastify.route({
        method: 'POST',
        url: '/staff-advance',
        preHandler: verifyToken,
        handler: createStaffAdvance
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-advance/:staffAdvanceId',
        preHandler: verifyToken,
        handler: updateStaffAdvance
    });

    fastify.route({
        method: 'GET',
        url: '/staff-advance-ledger',
        preHandler: verifyToken,
        handler: getStaffAdvanceLedger
    });
};