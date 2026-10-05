"use strict";

const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const Validator = require('fastest-validator');
const entryLogService = require("../service/branch-location-entry-log-service");

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /branch-location-entry-log
 *
 * Query params (all optional):
 *   entryLogId, staffId, branchId, branchLocationId,
 *   employeeName  – partial LIKE match
 *   date          – exact date  (YYYY-MM-DD)
 *   fromDate, toDate – date range
 *   status        – e.g. "Location Reached"
 *   notificationStatus – sent | failed | pending | not_sent
 *
 * Response includes:
 *   entryLogId, employeeName, officeName, entryTime, entryDate,
 *   distanceMetres, mobileModel, batteryLevel, status,
 *   notificationStatus, notificationSentAt, staffCode, branchCity
 */
async function getEntryLogs(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await entryLogService.getEntryLogs(req.query);
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
 * PUT /branch-location-entry-log/:entryLogId
 * Admin correction of entry details (entry time, status, mobile info, etc.)
 * Body: { employeeName?, officeName?, entryTime?, entryDate?,
 *         distanceMetres?, mobileModel?, batteryLevel?,
 *         status?, notificationStatus? }
 */
async function updateEntryLog(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const updateSchema = {
            employeeName:       { type: "string", optional: true },
            officeName:         { type: "string", optional: true },
            entryTime:          { type: "string", optional: true },
            entryDate:          { type: "string", optional: true },
            distanceMetres:     { type: "number", optional: true, min: 0 },
            mobileModel:        { type: "string", optional: true },
            batteryLevel:       { type: "string", optional: true },
            status:             { type: "string", optional: true },
            notificationStatus: { type: "string", optional: true }
        };

        const validation = v.validate(req.body, updateSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await entryLogService.updateEntryLog(
            req.params.entryLogId,
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
 * DELETE /branch-location-entry-log/:entryLogId
 */
async function deleteEntryLog(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await entryLogService.deleteEntryLog(req.params.entryLogId);
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
        url: '/branch-location-entry-log',
        // preHandler: verifyToken,
        handler: getEntryLogs
    });

    fastify.route({
        method: 'PUT',
        url: '/branch-location-entry-log/:entryLogId',
        // preHandler: verifyToken,
        handler: updateEntryLog
    });

    fastify.route({
        method: 'DELETE',
        url: '/branch-location-entry-log/:entryLogId',
        // preHandler: verifyToken,
        handler: deleteEntryLog
    });
};
