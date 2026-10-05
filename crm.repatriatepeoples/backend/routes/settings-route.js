"use strict";

const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const settingsServices = require("../service/settings-service");
const _ = require('lodash');

const schema = {
    // settingsName: { type: "string", optional: false, min: 1, max: 100 }
}

async function getSettings(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await settingsServices.getSettings(req.query);
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

async function updateSettings(req, res) {
    const responseEntries = new ResponseEntry();
    const v = new Validator();
    try {
        const filteredSchema = _.pick(schema, Object.keys(req.body));
        const validationResponse = v.validate(req.body, filteredSchema)
        if (validationResponse != true) {
            throw new Error(messages.VALIDATION_FAILED);
        } else {
            responseEntries.data = await settingsServices.updateSettings(req.params.companyInfoId, req.body);
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
        url: '/company-info',
        preHandler: verifyToken,
        handler: getSettings
    });

    fastify.route({
        method: 'PUT',
        url: '/company-info/:companyInfoId',
        preHandler: verifyToken,
        handler: updateSettings
    });
};