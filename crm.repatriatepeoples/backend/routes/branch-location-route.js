"use strict";

const Validator = require('fastest-validator');
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const branchLocationService = require("../service/branch-location-service");
const _ = require('lodash');

// ─── Validation schemas ───────────────────────────────────────────────────────

const createSchema = {
    staffId:             { type: "number", optional: false, positive: true },
    employeeName:        { type: "string", optional: true },
    branchId:            { type: "number", optional: true, positive: true },
    branchName:          { type: "string", optional: true },
    registeredLatitude:  { type: "number", optional: true },
    registeredLongitude: { type: "number", optional: true },
    liveLatitude:        { type: "number", optional: true },
    liveLongitude:       { type: "number", optional: true },
    role:                { type: "string", optional: true },
    officeEntryTime:     { type: "string", optional: true },
    fcmToken:            { type: "string", optional: true },
    locationRadius:      { type: "number", optional: true, positive: true },
    isActive:            { type: "boolean", optional: true }
};

const locationPatchSchema = {
    liveLatitude:   { type: "number", optional: false },
    liveLongitude:  { type: "number", optional: false },
    fcmToken:       { type: "string", optional: true },  // employee device token
    adminFcmToken:  { type: "string", optional: true },  // admin device token
    mobileModel:    { type: "string", optional: true },  // e.g. "Samsung Galaxy A54"
    batteryLevel:   { type: "string", optional: true }   // e.g. "78" or "78%"
};

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /branch-location
 * Query params: branchLocationId, staffId, branchId, trackingStatus,
 *               date (YYYY-MM-DD), isActive
 */
async function getBranchLocation(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await branchLocationService.getBranchLocation(req.query);
        if (!responseEntries.data || responseEntries.data.length === 0)
            responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error   = true;
        responseEntries.message = error.message || error;
        responseEntries.code    = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

/**
 * POST /branch-location
 * Register an employee's branch/location tracking record.
 * Body: { staffId, branchId, registeredLatitude, registeredLongitude,
 *         role, officeEntryTime, fcmToken, locationRadius, ... }
 */
async function createBranchLocation(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const validation = v.validate(req.body, createSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await branchLocationService.createBranchLocation(req.body);
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error   = true;
        responseEntries.message = error.message || error;
        responseEntries.code    = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

/**
 * PATCH /branch-location/:branchLocationId/live-location
 * Real-time GPS update. Triggers geofence check and push notification
 * when the employee enters the registered branch radius.
 * Body: { liveLatitude, liveLongitude, fcmToken? }
 */
async function updateLiveLocation(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const validation = v.validate(req.body, locationPatchSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await branchLocationService.updateLiveLocation(
            req.params.branchLocationId,
            req.body
        );
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error   = true;
        responseEntries.message = error.message || error;
        responseEntries.code    = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

/**
 * PUT /branch-location/:branchLocationId
 * Full record update (name, branch, role, officeEntryTime, status, etc.)
 */
async function updateBranchLocation(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const filteredSchema = _.pick(createSchema, Object.keys(req.body));
        const validation = v.validate(req.body, filteredSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await branchLocationService.updateBranchLocation(
            req.params.branchLocationId,
            req.body
        );
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error   = true;
        responseEntries.message = error.message || error;
        responseEntries.code    = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

/**
 * DELETE /branch-location/:branchLocationId
 */
async function deleteBranchLocation(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await branchLocationService.deleteBranchLocation(
            req.params.branchLocationId
        );
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
    } catch (error) {
        responseEntries.error   = true;
        responseEntries.message = error.message || error;
        responseEntries.code    = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
    } finally {
        res.send(responseEntries);
    }
}

// ─── Route registration ───────────────────────────────────────────────────────

module.exports = async function (fastify) {

    fastify.route({
        method: 'GET',
        url: '/branch-location',
        // preHandler: verifyToken,
        handler: getBranchLocation
    });

    fastify.route({
        method: 'POST',
        url: '/branch-location',
        // preHandler: verifyToken,
        handler: createBranchLocation
    });

    // PATCH – real-time GPS update (high-frequency endpoint)
    fastify.route({
        method: 'PATCH',
        url: '/branch-location/:branchLocationId/live-location',
        // preHandler: verifyToken,
        handler: updateLiveLocation
    });

    fastify.route({
        method: 'PUT',
        url: '/branch-location/:branchLocationId',
        // preHandler: verifyToken,
        handler: updateBranchLocation
    });

    fastify.route({
        method: 'DELETE',
        url: '/branch-location/:branchLocationId',
        // preHandler: verifyToken,
        handler: deleteBranchLocation
    });
};
