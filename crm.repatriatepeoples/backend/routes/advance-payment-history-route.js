"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const advancePaymentHistoryServices = require("../service/advance-payment-history-service");
const _ = require('lodash');

const schema = {
    // paidAmount: { type: "string", optional: false,  },
    // totalKm: { type: "string", optional: false,  },
    // amount: { type: "string", optional: false,  },
    // billNo: { type: "string", optional: false,  },
}

async function getAdvancePaymentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await advancePaymentHistoryServices.getAdvancePaymentHistory(req.query);
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

async function createAdvancePaymentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await advancePaymentHistoryServices.createAdvancePaymentHistory(req.body);
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

async function updateAdvancePaymentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await advancePaymentHistoryServices.updateAdvancePaymentHistory(req.params.advancePaymentHistoryId, req.body);
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
        url: '/advance-payment-history',
        preHandler: verifyToken,
        handler: getAdvancePaymentHistory
    });

    fastify.route({
        method: 'POST',
        url: '/advance-payment-history',
        preHandler: verifyToken,
        handler: createAdvancePaymentHistory
    });

    fastify.route({
        method: 'PUT',
        url: '/advance-payment-history/:advancePaymentHistoryId',
        preHandler: verifyToken,
        handler: updateAdvancePaymentHistory
    });
};