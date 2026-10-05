"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const branchServices = require("../service/branch-service");
const _ = require('lodash');

const schema = {
    branchName:    { type: "string",  optional: false },
    address:       { type: "string",  optional: true  },
    city:          { type: "string",  optional: true  },
    pincode:       { type: "string",  optional: true  },
    email:         { type: "string",  optional: true  },
    contactNo:     { type: "string",  optional: true  },
    latitude:      { type: "number",  optional: true  },
    longitude:     { type: "number",  optional: true  },
    allowedRadius: { type: "number",  optional: true, positive: true },
    isActive:      { type: "boolean", optional: true  }
}

async function getBranch(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await branchServices.getBranch(req.query);
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

async function createBranch(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const validationResponse = await v.validate(req.body, schema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {            
            responseEntries.data = await branchServices.createBranch(req.body);
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

async function updateBranch(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator()
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await branchServices.updateBranch(req.params.branchId, req.body);
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


async function deleteBranch(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await branchServices.deleteBranch(req.params.branchId);
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

module.exports = async function (fastify) {
    fastify.route({
        method: 'GET',
        url: '/branch',
        // preHandler: verifyToken,
        handler: getBranch
    });

    fastify.route({
        method: 'POST',
        url: '/branch',
        // preHandler: verifyToken,
        handler: createBranch
    });

    fastify.route({
        method: 'PUT',
        url: '/branch/:branchId',
        // preHandler: verifyToken,
        handler: updateBranch
    });

    fastify.route({
        method: 'DELETE',
        url: '/branch/:branchId',
        // preHandler: verifyToken,
        handler: deleteBranch
    });
};