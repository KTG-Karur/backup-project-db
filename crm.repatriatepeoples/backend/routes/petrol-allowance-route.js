"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const petrolAllowanceServices = require("../service/petrol-allowance-service");
const _ = require('lodash');

const schema = {
    staffId: "number|required|integer|positive",
    fromPlace: { type: "string", optional: false, },
    toPlace: { type: "string", optional: false, },
    activityId: { type: "string", optional: false, },
    // totalKm: { type: "string", optional: false, },
    // amount: { type: "string", optional: false, },
    // billNo: { type: "string", optional: false, },
}

async function getPetrolAllowance(req, res) {
    const responseEntries = new ResponseEntry();
    let user = req.user;
    console.log("user")
    console.log(user)
    if (user.roleName && user.roleName !== 'Super Admin') {
        if (!user.petrolAllowanceFlag)
            req.query.staffId = user.staffId;
    }
    try {
        responseEntries.data = await petrolAllowanceServices.getPetrolAllowance(req.query);
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

async function getPetrolReportAllowance(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await petrolAllowanceServices.getPetrolReportAllowance(req.query);
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

async function createPetrolAllowance(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await petrolAllowanceServices.createPetrolAllowance(req.body);
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

async function updatePetrolAllowance(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await petrolAllowanceServices.updatePetrolAllowance(req.params.petrolAllowanceId, req.body);
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

async function approvePetrolAllowanceImage(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        const user = req.user;
        responseEntries.data = await petrolAllowanceServices.approvePetrolAllowanceImage(
            req.params.petrolAllowanceId,
            user
        );
        if (!responseEntries.data) {
            responseEntries.message = "Petrol allowance record not found";
        }
    } catch (error) {
        responseEntries.error = true;
        responseEntries.message = error.message;
        responseEntries.code = 400;
        res.status(400);
    } finally {
        res.send(responseEntries);
    }
}

async function disapprovePetrolAllowanceImage(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        const user = req.user;
        responseEntries.data = await petrolAllowanceServices.disapprovePetrolAllowanceImage(
            req.params.petrolAllowanceId,
            user
        );
        if (!responseEntries.data) {
            responseEntries.message = messages.DATA_NOT_FOUND;
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
        url: '/petrol-allowance',
        preHandler: verifyToken,
        handler: getPetrolAllowance
    });

    fastify.route({
        method: 'GET',
        url: '/petrol-allowance-report',
        preHandler: verifyToken,
        handler: getPetrolReportAllowance
    });

    fastify.route({
        method: 'POST',
        url: '/petrol-allowance',
        preHandler: verifyToken,
        handler: createPetrolAllowance
    });

    fastify.route({
        method: 'PUT',
        url: '/petrol-allowance/:petrolAllowanceId/approve-image',
        preHandler: verifyToken,
        handler: approvePetrolAllowanceImage
    });

    fastify.route({
        method: 'PUT',
        url: '/petrol-allowance/:petrolAllowanceId/disapprove-image',
        preHandler: verifyToken,
        handler: disapprovePetrolAllowanceImage

    });

    fastify.route({
        method: 'PUT',
        url: '/petrol-allowance/:petrolAllowanceId',
        preHandler: verifyToken,
        handler: updatePetrolAllowance
    });
};