"use strict";

const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const visitSessionService = require("../service/visit-session-service");

async function getVisitSessions(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await visitSessionService.getVisitSessions(req.query);
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

async function getVisitSessionDetail(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await visitSessionService.getVisitSessionDetail(req.params.entryLogId);
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

module.exports = async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/visit-sessions',
    preHandler: verifyToken,
    handler: getVisitSessions
  });

  fastify.route({
    method: 'GET',
    url: '/visit-session/:entryLogId',
    preHandler: verifyToken,
    handler: getVisitSessionDetail
  });
};
