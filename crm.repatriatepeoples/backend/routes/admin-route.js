"use strict";

const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");

const staffAttendanceServices = require("../service/staff-attendance-service");
const staffGeolocationServices = require("../service/staff-geolocation-service");
const branchLocationEntryLogServices = require("../service/branch-location-entry-log-service");
const claimServices = require("../service/claim-service");

async function getAdminAttendance(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffAttendanceServices.getAdminAttendance(req.query);
        if (!responseEntries.data || responseEntries.data.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
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

async function getAdminLiveTracking(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffGeolocationServices.getAdminLiveTracking(req.query);
        if (!responseEntries.data || responseEntries.data.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
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

async function getAdminVisitSummary(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await branchLocationEntryLogServices.getVisitSummary(req.query);
        if (!responseEntries.data || responseEntries.data.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
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

async function getAdminVisitDetails(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await branchLocationEntryLogServices.getVisitDetails(req.query);
        if (!responseEntries.data || responseEntries.data.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
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

async function getAdminClaims(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await claimServices.getClaim(req.query);
        if (!responseEntries.data || responseEntries.data.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
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

module.exports = async function (fastify) {
    fastify.route({
        method: 'GET',
        url: '/api/admin/attendance',
        preHandler: verifyToken,
        handler: getAdminAttendance
    });

    fastify.route({
        method: 'GET',
        url: '/api/admin/live-tracking',
        preHandler: verifyToken,
        handler: getAdminLiveTracking
    });

    fastify.route({
        method: 'GET',
        url: '/api/admin/visit-summary',
        preHandler: verifyToken,
        handler: getAdminVisitSummary
    });

    fastify.route({
        method: 'GET',
        url: '/api/admin/visit-details',
        preHandler: verifyToken,
        handler: getAdminVisitDetails
    });

    fastify.route({
        method: 'GET',
        url: '/api/admin/claims',
        preHandler: verifyToken,
        handler: getAdminClaims
    });
};
