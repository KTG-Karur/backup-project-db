"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const claimServices = require("../service/claim-service");
const _ = require('lodash');

const schema = {
    requestedBy: "number|required|integer|positive",
    claimTypeId: "number|required|integer|positive",
    requestedAmount: { type: "string", optional: false,  },
    // branchId: "number|required|integer|positive",
    // applyDate: { type: "string", optional: false,  },
    modeOfPaymentId: "number|required|integer|positive",
}

async function getClaim(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await claimServices.getClaim(req.query);
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

async function createClaim(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        console.log(validationResponse)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await claimServices.createClaim(req.body);
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

async function updateClaim(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await claimServices.updateClaim(req.params.claimId, req.body, req.user);
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
        url: '/claim',
        preHandler: verifyToken,
        handler: getClaim
    });

    fastify.route({
        method: 'POST',
        url: '/claim',
        preHandler: verifyToken,
        handler: createClaim
    });

    fastify.route({
        method: 'PUT',
        url: '/claim/:claimId',
        preHandler: verifyToken,
        handler: updateClaim
    });
};