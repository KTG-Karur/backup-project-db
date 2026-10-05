"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffLoanServices = require("../service/staff-loan-service");
const _ = require('lodash');

const schema = {
    // staffId: "number|required|integer|positive",
    // amount: { type: "string", optional: false },
}

async function getStaffLoan(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffLoanServices.getStaffLoan(req.query);
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

async function getLoanList(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffLoanServices.getLoanList(req.query);
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

async function getLoanPaymentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await staffLoanServices.getLoanPaymentHistory(req.query);
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

async function getStaffLoanLedger(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        // responseEntries.data = await staffLoanServices.getStaffLoanLedger(req.query);
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

async function createLoanPayment(req, res) {

    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)

        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffLoanServices.createLoanPayment(req.body);
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

async function createStaffLoan(req, res) {

    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)

        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffLoanServices.createStaffLoan(req.body);
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

async function updateStaffLoan(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await staffLoanServices.updateStaffLoan(req.params.staffLoanId, req.body);
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


async function deletePaymentHistory(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    console.log("req.params")
    console.log(req.params)
    try {
        responseEntries.data = await staffLoanServices.deletePaymentHistory(req.params.loanPaymentId, req.body);
        if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
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
        url: '/staff-loan',
        preHandler: verifyToken,
        handler: getStaffLoan
    });

    fastify.route({
        method: 'GET',
        url: '/loan-list',
        preHandler: verifyToken,
        handler: getLoanList
    });

    fastify.route({
        method: 'GET',
        url: '/loan-list-details',
        preHandler: verifyToken,
        handler: getLoanPaymentHistory
    });

    fastify.route({
        method: 'POST',
        url: '/staff-loan',
        preHandler: verifyToken,
        handler: createStaffLoan
    });
    fastify.route({
        method: 'POST',
        url: '/loan-payment',
        preHandler: verifyToken,
        handler: createLoanPayment
    });

    fastify.route({
        method: 'PUT',
        url: '/loan-payment-history/:loanPaymentId',
        preHandler: verifyToken,
        handler: deletePaymentHistory
    });

    fastify.route({
        method: 'PUT',
        url: '/staff-loan/:staffLoanId',
        preHandler: verifyToken,
        handler: updateStaffLoan
    });

    fastify.route({
        method: 'GET',
        url: '/staff-loan-ledger',
        preHandler: verifyToken,
        handler: getStaffLoanLedger
    });
};