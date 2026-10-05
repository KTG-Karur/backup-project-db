"use strict";

const Validator = require('fastest-validator');
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const officeArrivalService = require("../service/office-arrival-service");

// ─── Validation schema ────────────────────────────────────────────────────────

const arrivalSchema = {
    staffId:       { type: "number", optional: false, positive: true },
    branchId:      { type: "number", optional: false, positive: true },
    liveLatitude:  { type: "number", optional: false },
    liveLongitude: { type: "number", optional: false },
    mobileModel:   { type: "string", optional: true },
    batteryLevel:  { type: "string", optional: true },
    fcmToken:      { type: "string", optional: true },
    entryTime:     { type: "string", optional: true }  // ISO datetime; defaults to now
};

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * POST /office-arrival
 *
 * Mobile app submits employee GPS position.
 * Service checks geofence, records entry, and notifies admins via FCM.
 *
 * Body:
 *   staffId        {number}  required – employee staff ID
 *   branchId       {number}  required – branch to check against
 *   liveLatitude   {number}  required – current GPS latitude
 *   liveLongitude  {number}  required – current GPS longitude
 *   mobileModel    {string}  optional – device model e.g. "Samsung Galaxy A54"
 *   batteryLevel   {string}  optional – battery % e.g. "78" or "78%"
 *   fcmToken       {string}  optional – employee FCM token
 *   entryTime      {string}  optional – ISO datetime (defaults to server time)
 *
 * Response includes:
 *   withinRadius   {boolean} – whether employee is inside the geofence
 *   distanceMetres {number}  – actual distance from branch centre
 *   status         {string}  – "Location Reached" | "Outside Radius"
 *   notificationResult       – FCM delivery summary
 */
async function submitOfficeArrival(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const validation = v.validate(req.body, arrivalSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await officeArrivalService.submitOfficeArrival(req.body);
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

const officeOutSchema = {
    officeOutTime: { type: "string", optional: true },
    latitude:      { type: "number", optional: true },
    longitude:     { type: "number", optional: true },
    batteryLevel:  { type: "string", optional: true }
};

async function submitOfficeOut(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const validation = v.validate(req.body, officeOutSchema);
        if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

        responseEntries.data = await officeArrivalService.submitOfficeOut(
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

// ─── Route registration ───────────────────────────────────────────────────────

module.exports = async function (fastify) {
    fastify.route({
        method: 'POST',
        url: '/office-arrival',
        // preHandler: verifyToken,
        handler: submitOfficeArrival
    });

    fastify.route({
        method: 'POST',
        url: '/office-out/:entryLogId',
        handler: submitOfficeOut
    });
};
