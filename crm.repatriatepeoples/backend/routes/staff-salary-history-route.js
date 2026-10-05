"use strict";

const Validator = require('fastest-validator');
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffSalaryHistoryServices = require("../service/staff-salary-history-service");
const _ = require('lodash');

const schema = {
    // staffId: "number|required|integer|positive",
}

async function getStaffSalaryHistory(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffSalaryHistoryServices.getStaffSalaryHistory(req.query);
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

async function getStaffSalaryHistoryDetails(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffSalaryHistoryServices.getStaffSalaryHistoryDetails(req.query);
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

async function createStaffSalaryHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema);
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffSalaryHistoryServices.createStaffSalaryHistory(req.body);
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

async function updateStaffSalaryHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffSalaryHistoryServices.updateStaffSalaryHistory(req.params.staffSalaryHistoryId, req.body);
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
        url: '/staff-salary-history',
        preHandler: verifyToken,
        handler: getStaffSalaryHistory
    });
    fastify.route({
        method: 'GET',
        url: '/staff-salary-history-details',
        preHandler: verifyToken,
        handler: getStaffSalaryHistoryDetails
    });

    fastify.route({
        method: 'POST',
        url: '/staff-salary-history',
        preHandler: verifyToken,
        handler: createStaffSalaryHistory
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-salary-history/:staffSalaryHistoryId',
        preHandler: verifyToken,
        handler: updateStaffSalaryHistory
    });
};