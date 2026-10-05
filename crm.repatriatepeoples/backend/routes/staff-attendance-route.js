"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffAttendanceServices = require("../service/staff-attendance-service");
const { ACCESS_IDS, hasPageAccess } = require("../service/access-service");
const _ = require('lodash');

const schema = {
    // staffId: "number|required|integer|positive",
    //activityId: { type: "string", optional: false, min: 1, max: 100 },
    // totalKm: { type: "string", optional: false, min: 1, max: 100 },
    // amount: { type: "string", optional: false, min: 1, max: 100 },
    // billNo: { type: "string", optional: false, min: 1, max: 100 },

}

async function getStaffAttendance(req, res) {
    const responseEntries = new ResponseEntry();
    let user = req.user;
if (user.roleName && user.roleName !== 'Super Admin') {
    const canViewAll = await hasPageAccess(user.staffId, '/attendance/staff-attendance', ACCESS_IDS.ADMIN_ACCESS);
    if(!user.staffViewFlag && !canViewAll)
    req.query.staffId = user.staffId;
}
    try {
        responseEntries.data = await staffAttendanceServices.getStaffAttendance(req.query);
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

async function getStaffAttendanceList(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffAttendanceServices.getStaffAttendanceList(req.query);
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

async function getStaffAttendanceOne(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffAttendanceServices.getStaffAttendanceList(req.query);
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

async function getStaffAttendanceReport(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffAttendanceServices.getStaffAttendanceReport(req.query);
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

async function createStaffAttendance(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffAttendanceServices.createStaffAttendance(req.body);
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

async function updateStaffAttendance(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        // const filteredSchema = _.pick(schema, Object.keys(req.body));
        // const validationResponse = v.validate(req.body, filteredSchema)
        // if (validationResponse != true) {
        //     throw new Error(messages.VALIDATION_FAILED);
        // } else {
            responseEntries.data = await staffAttendanceServices.updateStaffAttendance(req.body);
            if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
        // }
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
        url: '/staff-attendance',
        preHandler: verifyToken,
        handler: getStaffAttendance
    });

    fastify.route({
        method: 'GET',
        url: '/staff-attendance-list',
        // preHandler: verifyToken,
        handler: getStaffAttendanceList
    });

    fastify.route({
        method: 'GET',
        url: '/staff-attendance-report',
        preHandler: verifyToken,
        handler: getStaffAttendanceReport
    });

    fastify.route({
        method: 'POST',
        url: '/staff-attendance',
        preHandler: verifyToken,
        handler: createStaffAttendance
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-attendance',
        preHandler: verifyToken,
        handler: updateStaffAttendance
    });
};