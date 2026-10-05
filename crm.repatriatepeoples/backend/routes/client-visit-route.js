"use strict";

const Validator = require('fastest-validator');
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const clientVisitService = require("../service/client-visit-service");

const createClientVisitSchema = {
  entryLogId:      { type: "number", optional: false, positive: true },
  staffId:         { type: "number", optional: true, positive: true },
  clientName:      { type: "string", optional: false },
  clientCode:      { type: "string", optional: true },
  contactPerson:   { type: "string", optional: true },
  contactNo:       { type: "string", optional: true },
  visitCategory:   { type: "string", optional: false,
                     enum: ['Collection', 'Delivery', 'Follow-up Visit', 'New Account Opening', 'Complaint Resolution'] },
  reachedLatitude: { type: "number", optional: true },
  reachedLongitude:{ type: "number", optional: true },
  reachedTime:     { type: "string", optional: true },
  formData:        { type: "object", optional: true },
  photoUrl:        { type: "string", optional: true }
};

const clientOutSchema = {
  departedTime: { type: "string", optional: true },
  formData:     { type: "object", optional: true },
  photoUrl:     { type: "string", optional: true }
};

async function createClientVisit(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validation = v.validate(req.body, createClientVisitSchema);
    if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

    responseEntries.data = await clientVisitService.createClientVisit(req.body);
    if (!responseEntries.data) responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message || error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function getClientVisits(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await clientVisitService.getClientVisits(req.query);
    if (!responseEntries.data || responseEntries.data.length === 0)
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message || error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function updateClientVisit(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const schema = {
      clientName:      { type: "string", optional: true },
      clientForm:      { type: "string", optional: true },
      clientCode:      { type: "string", optional: true },
      contactPerson:   { type: "string", optional: true },
      memberName:      { type: "string", optional: true },
      contactNo:       { type: "string", optional: true },
      cellNoName:      { type: "string", optional: true },
      visitCategory:   { type: "string", optional: true },
      centreNoName:    { type: "string", optional: true },
      branchVisit:     { type: "string", optional: true },
      collectionAmount:{ type: "string", optional: true },
      attachment:      { type: "string", optional: true },
      photoUrl:        { type: "string", optional: true },
      nextDueDate:     { type: "string", optional: true },
      formData:        { type: "object", optional: true }
    };
    const validation = v.validate(req.body, schema);
    if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

    responseEntries.data = await clientVisitService.updateClientVisit(
      req.params.clientVisitId,
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

async function submitClientOut(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validation = v.validate(req.body, clientOutSchema);
    if (validation !== true) throw new Error(messages.VALIDATION_FAILED);

    responseEntries.data = await clientVisitService.submitClientOut(
      req.params.clientVisitId,
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

module.exports = async function (fastify) {
  fastify.route({
    method: 'POST',
    url: '/client-visit',
    handler: createClientVisit
  });

  fastify.route({
    method: 'POST',
    url: '/client-out/:clientVisitId',
    handler: submitClientOut
  });

  fastify.route({
    method: 'PUT',
    url: '/client-visit/:clientVisitId',
    handler: updateClientVisit
  });

  fastify.route({
    method: 'GET',
    url: '/client-visits',
    preHandler: verifyToken,
    handler: getClientVisits
  });
};
