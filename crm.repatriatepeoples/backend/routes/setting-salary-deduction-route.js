"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const settingSalaryDeductionServices = require("../service/setting-salary-deduction-service");
const _ = require('lodash');

const schema = {
    deductionValue: { type: "string", optional: false, },
    deductionName: { type: "string", optional: false },
}

async function getSettingSalaryDeduction(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await settingSalaryDeductionServices.getSettingSalaryDeduction(req.query);
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

async function createSettingSalaryDeduction(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await settingSalaryDeductionServices.createSettingSalaryDeduction(req.body);
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

async function updateSettingSalaryDeduction(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await settingSalaryDeductionServices.updateSettingSalaryDeduction(req.params.settingSalaryDeductionId, req.body);
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
        url: '/setting-salary-deduction',
        preHandler: verifyToken,
        handler: getSettingSalaryDeduction
    });

    fastify.route({
        method: 'POST',
        url: '/setting-salary-deduction',
        preHandler: verifyToken,
        handler: createSettingSalaryDeduction
    });

    fastify.route({
        method: 'PUT',
        url: '/setting-salary-deduction/:settingSalaryDeductionId',
        preHandler: verifyToken,
        handler: updateSettingSalaryDeduction
    });
};