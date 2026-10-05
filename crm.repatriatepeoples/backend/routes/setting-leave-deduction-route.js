"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const settingLeaveDeductionServices = require("../service/setting-leave-deduction-service");
const _ = require('lodash');

const schema = {

    leaveDeductionPercentage: { type: "string", optional: false,},
    leaveCountDay: { type: "string", optional: false },
    // leaveTypeId: "number|required|integer|positive",
    // totalKm: { type: "string", optional: false, min: 1, max: 100 },
    // amount: { type: "string", optional: false, min: 1, max: 100 },
    // billNo: { type: "string", optional: false, min: 1, max: 100 },
}

async function getSettingLeaveDeduction(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await settingLeaveDeductionServices.getSettingLeaveDeduction(req.query);
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

async function createSettingLeaveDeduction(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await settingLeaveDeductionServices.createSettingLeaveDeduction(req.body);
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

async function updateSettingLeaveDeduction(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await settingLeaveDeductionServices.updateSettingLeaveDeduction(req.params.settingLeaveDeductionId, req.body);
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
        url: '/setting-leave-deduction',
        preHandler: verifyToken,
        handler: getSettingLeaveDeduction
    });

    fastify.route({
        method: 'POST',
        url: '/setting-leave-deduction',
        preHandler: verifyToken,
        handler: createSettingLeaveDeduction
    });

    fastify.route({
        method: 'PUT',
        url: '/setting-leave-deduction/:settingLeaveDeductionId',
        preHandler: verifyToken,
        handler: updateSettingLeaveDeduction
    });
};