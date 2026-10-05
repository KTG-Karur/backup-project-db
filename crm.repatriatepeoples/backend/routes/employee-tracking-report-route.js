"use strict";

const Validator = require('fastest-validator');
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const reportService = require("../service/employee-tracking-report-service");
const _ = require('lodash');

// ─── Validation schemas ───────────────────────────────────────────────────────

const createSchema = {
    staffId:           { type: "number", optional: true,  positive: true },
    employeeName:      { type: "string", optional: true  },
    trackingDate:      { type: "string", optional: true  },   // YYYY-MM-DD; defaults to today
    totalDistanceKm:   { type: "number", optional: true,  min: 0 },
    mobileModel:       { type: "string", optional: true  },
    batteryLevel:      { type: "string", optional: true  },   // e.g. "85" or "85%"
    trackingStartTime: { type: "string", optional: true  },   // ISO datetime
    trackingEndTime:   { type: "string", optional: true  },
    isActive:          { type: "boolean", optional: true }
};

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * GET /employee-tracking-report
 * Query params:
 *   reportId, staffId, employeeName (partial match), date (YYYY-MM-DD),
 *   fromDate, toDate, isActive
 */
async function getEmployeeTrackingReport(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await reportService.getEmployeeTrackingReport(req.query);
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
 * GET /employee-tracking-report/:reportId
 * Fetch a single report by its ID.
 */
async function getEmployeeTrackingReportById(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        const rows = await reportService.getEmployeeTrackingReport({ reportId: req.params.reportId });
        responseEntries.data = rows && rows.length ? rows[0] : null;
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
 * GET /employee-tracking-report/km-summary
 * Aggregates total KM traveled per employee.
 * Query params: staffId, employeeName, date, fromDate, toDate
 */
async function getTrackingKmSummary(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await reportService.getTrackingKmSummary(req.query);
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
 * POST /employee-tracking-report
 * Save an employee tracking session.
 * Body: { staffId?, employeeName?, trackingDate?, totalDistanceKm,
 *         mobileModel, batteryLevel, trackingStartTime, trackingEndTime }
 *
 * - employeeName is auto-filled from staffs table when staffId is supplied
 * - trackingDate defaults to today when omitted
 * - batteryLevel normalised to "85%" format automatically
 */
async function createEmployeeTrackingReport(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const validation = v.validate(req.body, createSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        // At least one of staffId or employeeName must be supplied
        if (!req.body.staffId && !req.body.employeeName)
            throw new Error('staffId or employeeName is required.');

        responseEntries.data = await reportService.createEmployeeTrackingReport(req.body);
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
 * PUT /employee-tracking-report/:reportId
 * Update tracking session details (distance, device info, times, etc.)
 */
async function updateEmployeeTrackingReport(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const filteredSchema = _.pick(createSchema, Object.keys(req.body));
        const validation = v.validate(req.body, filteredSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await reportService.updateEmployeeTrackingReport(
            req.params.reportId,
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
 * DELETE /employee-tracking-report/:reportId
 */
async function deleteEmployeeTrackingReport(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await reportService.deleteEmployeeTrackingReport(
            req.params.reportId
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

    // GET – fetch reports filtered by employeeName and/or date
    fastify.route({
        method: 'GET',
        url: '/employee-tracking-report',
        // preHandler: verifyToken,
        handler: getEmployeeTrackingReport
    });

    // GET – total KM summary aggregated per employee (static route before param)
    fastify.route({
        method: 'GET',
        url: '/employee-tracking-report/km-summary',
        // preHandler: verifyToken,
        handler: getTrackingKmSummary
    });

    // GET – fetch single report by ID
    fastify.route({
        method: 'GET',
        url: '/employee-tracking-report/:reportId',
        // preHandler: verifyToken,
        handler: getEmployeeTrackingReportById
    });

    // POST – save new tracking session
    fastify.route({
        method: 'POST',
        url: '/employee-tracking-report',
        // preHandler: verifyToken,
        handler: createEmployeeTrackingReport
    });

    // PUT – update existing tracking session
    fastify.route({
        method: 'PUT',
        url: '/employee-tracking-report/:reportId',
        // preHandler: verifyToken,
        handler: updateEmployeeTrackingReport
    });

    // DELETE – remove tracking report
    fastify.route({
        method: 'DELETE',
        url: '/employee-tracking-report/:reportId',
        // preHandler: verifyToken,
        handler: deleteEmployeeTrackingReport
    });
};
