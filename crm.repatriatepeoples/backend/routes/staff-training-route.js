"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffTrainingServices = require("../service/staff-training-service");
const _ = require('lodash');

const schema = {
    // staffId: "number|required|integer|positive",
    fromPlace: "number|required|integer|positive",
    toPlace: "number|required|integer|positive",
    //activityId: { type: "string", optional: false, min: 1, max: 100 },
    // totalKm: { type: "string", optional: false, min: 1, max: 100 },
    // amount: { type: "string", optional: false, min: 1, max: 100 },
    // billNo: { type: "string", optional: false, min: 1, max: 100 },
}

async function getStaffTraining(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffTrainingServices.getStaffTraining(req.query);
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

async function createStaffTraining(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffTrainingServices.createStaffTraining(req.body);
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

async function updateStaffTraining(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffTrainingServices.updateStaffTraining(req.params.staffTrainingId, req.body);
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
        url: '/staff-training',
        preHandler: verifyToken,
        handler: getStaffTraining
    });

    fastify.route({
        method: 'POST',
        url: '/staff-training',
        preHandler: verifyToken,
        handler: createStaffTraining
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-training/:staffTrainingId',
        preHandler: verifyToken,
        handler: updateStaffTraining
    });
};