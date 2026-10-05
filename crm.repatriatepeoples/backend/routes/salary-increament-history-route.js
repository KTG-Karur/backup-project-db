"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const salaryIncreamentHistoryServices = require("../service/salary-increament-history-service");
const _ = require('lodash');

const schema = {
    // salaryIncreamentHistoryName: { type: "string", optional: false, min: 1, max: 100 },
    /*address: { type: "string", optional: false, min: 1, max: 100 },
    email: { type: "string", optional: false, min: 1, max: 100 },
    city: { type: "string", optional: false, min: 1, max: 100 },
    contactNo: { type: "number", optional: false, min: 10, max: 10 },
    pincode: { type: "number", optional: false, min: 6, max: 6 },*/
}

async function getSalaryIncreamentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await salaryIncreamentHistoryServices.getSalaryIncreamentHistory(req.query);
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

async function createSalaryIncreamentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {            
            responseEntries.data = await salaryIncreamentHistoryServices.createSalaryIncreamentHistory(req.body);
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

async function updateSalaryIncreamentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await salaryIncreamentHistoryServices.updateSalaryIncreamentHistory(req.params.salaryIncreamentHistoryId, req.body);
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
        url: '/salary-increament-history',
        preHandler: verifyToken,
        handler: getSalaryIncreamentHistory
    });

    fastify.route({
        method: 'POST',
        url: '/salary-increament-history',
        preHandler: verifyToken,
        handler: createSalaryIncreamentHistory
    });

    fastify.route({
        method: 'PUT',
        url: '/salary-increament-history/:salaryIncreamentHistoryId',
        preHandler: verifyToken,
        handler: updateSalaryIncreamentHistory
    });
};