"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const attendanceInchargeServices = require("../service/attendance-incharge-service");
const _ = require('lodash');

const schema = {
    staffId: "number|required|integer|positive",
    departmentId: "number|required|integer|positive",
    // branchId: "number|required|integer|positive",
}

async function getAttendanceIncharge(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await attendanceInchargeServices.getAttendanceIncharge(req.query);
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

async function createAttendanceIncharge(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await attendanceInchargeServices.createAttendanceIncharge(req.body);
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

async function updateAttendanceIncharge(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await attendanceInchargeServices.updateAttendanceIncharge(req.params.attendanceInchargeId, req.body);
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
        url: '/attendance-incharge',
        preHandler: verifyToken,
        handler: getAttendanceIncharge
    });

    fastify.route({
        method: 'POST',
        url: '/attendance-incharge',
        preHandler: verifyToken,
        handler: createAttendanceIncharge
    });

    fastify.route({
        method: 'PUT',
        url: '/attendance-incharge/:attendanceInchargeId',
        preHandler: verifyToken,
        handler: updateAttendanceIncharge
    });
};