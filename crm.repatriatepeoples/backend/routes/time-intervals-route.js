"use strict";
const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const timeIntervalsServices = require("../service/time-intervals-service");
const _ = require('lodash');

const schema = {
  staffId: { type: "number", optional: false },
  timeStatus: { type: "number", optional: true },
  attendanceMarkType: { type: "number", optional: true },
  status: { type: "number", optional: true },
  attendanceType: { type: "number", optional: true },
  imageName: { type: "string", optional: true },
  networkStatus: { type: "string", optional: true },
  battery: { type: "string", optional: true },
  flightMode: { type: "string", optional: true },
  address: { type: "string", optional: true },
  brand: { type: "string", optional: true },
  manufacturer: { type: "string", optional: true },
  board: { type: "string", optional: true },
  device: { type: "string", optional: true },
  display: { type: "string", optional: true },
  hardware: { type: "string", optional: true },
  model: { type: "string", optional: true },
  product: { type: "string", optional: true },
  updatedAt: { type: "number", optional: true },
  latitude: { type: "string", optional: true },
  longitude: { type: "string", optional: true },
  coordinates: { type: "array", optional: true },
  mongoId: { type: "string", optional: true },
  actionType: { type: "string", optional: true },
  recordCreatedAt: { type: "number", optional: true },
  coordinatesPoints: { type: "string", optional: true },
  workTime: { type: "string", optional: true },
  totalWorkTime: { type: "string", optional: true },
  distance: { type: "string", optional: true },
  speed: { type: "string", optional: true },
  kmDifference: { type: "string", optional: true },
  timeTravelled: { type: "string", optional: true },
  mobileStatus: { type: "string", optional: true },
  imageUrl: { type: "string", optional: true },
  formDetailId: { type: "string", optional: true },
  formId: { type: "string", optional: true },
  clientForm: { type: "string", optional: true },
  branchVisit: { type: "string", optional: true },
  centreNoName: { type: "string", optional: true },
  memberName: { type: "string", optional: true },
  collectionAmount: { type: "string", optional: true },
  cellNoName: { type: "string", optional: true },
  attachment: { type: "string", optional: true },
  nextDueDate: { type: "string", optional: true },
  formData: { type: "object", optional: true }
}

async function getTimeIntervals1(req, res) {
  const responseEntries = new ResponseEntry();
  try {
     if (!req.query.staffId || !req.query.date) {
      responseEntries.error = true;
      responseEntries.message = "staffId and date parameters are required";
      responseEntries.code = responseCode.BAD_REQUEST;
      return res.status(responseCode.BAD_REQUEST).send(responseEntries);
    }
    responseEntries.data = await timeIntervalsServices.getTimeIntervals(req.query);
    if (!responseEntries.data || responseEntries.data.length === 0) 
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}
async function getTimeIntervals(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    // Check if either date OR both fromDate and toDate are provided
    if (!req.query.date && (!req.query.fromDate || !req.query.toDate)) {
      responseEntries.error = true;
      responseEntries.message = "Either date OR both fromDate and toDate parameters are required";
      responseEntries.code = responseCode.BAD_REQUEST;
      return res.status(responseCode.BAD_REQUEST).send(responseEntries);
    }
    
    // Validate date range if fromDate and toDate are provided
    if (req.query.fromDate && req.query.toDate) {
      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        responseEntries.error = true;
        responseEntries.message = "Invalid date format. Use YYYY-MM-DD";
        responseEntries.code = responseCode.BAD_REQUEST;
        return res.status(responseCode.BAD_REQUEST).send(responseEntries);
      }
      
      if (fromDate > toDate) {
        responseEntries.error = true;
        responseEntries.message = "fromDate cannot be after toDate";
        responseEntries.code = responseCode.BAD_REQUEST;
        return res.status(responseCode.BAD_REQUEST).send(responseEntries);
      }
    }
    
    if (!req.query.staffId) {
      responseEntries.error = true;
      responseEntries.message = "staffId parameter is required";
      responseEntries.code = responseCode.BAD_REQUEST;
      return res.status(responseCode.BAD_REQUEST).send(responseEntries);
    }
    
    responseEntries.data = await timeIntervalsServices.getTimeIntervals(req.query);
    if (!responseEntries.data || responseEntries.data.length === 0) {
      responseEntries.message = messages.DATA_NOT_FOUND;
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

async function getTimeIntervalDetails(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await timeIntervalsServices.getTimeIntervalDetails(req.query);
    if (!responseEntries.data) 
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function createTimeInterval(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await timeIntervalsServices.createTimeInterval(req.body);
      if (!responseEntries.data) 
        responseEntries.message = messages.DATA_NOT_FOUND;
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

async function updateTimeInterval(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await timeIntervalsServices.updateTimeInterval(req.params.id, req.body);
      if (!responseEntries.data) 
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

async function deleteTimeInterval(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await timeIntervalsServices.deleteTimeInterval(req.params.id);
    if (!responseEntries.data) 
      responseEntries.message = messages.DATA_NOT_FOUND;
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = error.code ? error.code : responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function bulkCreateTimeIntervals(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    // Validate each item in the array
    if (!Array.isArray(req.body)) {
      throw new Error("Request body must be an array");
    }

    for (const item of req.body) {
      const validationResponse = await v.validate(item, schema);
      if (validationResponse !== true) {
        throw new Error(messages.VALIDATION_FAILED);
      }
    }

    responseEntries.data = await timeIntervalsServices.bulkCreateTimeIntervals(req.body);
    if (!responseEntries.data || responseEntries.data.length === 0) 
      responseEntries.message = messages.DATA_NOT_FOUND;
    else
      responseEntries.message = messages.BULK_CREATE_SUCCESS;
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
    url: '/time-intervals',
    // preHandler: verifyToken,
    handler: getTimeIntervals
  });
  
  fastify.route({
    method: 'GET',
    url: '/time-interval-details',
    preHandler: verifyToken,
    handler: getTimeIntervalDetails
  });
  
  fastify.route({
    method: 'POST',
    url: '/time-interval',
    // preHandler: verifyToken,
    handler: createTimeInterval
  });
  
  fastify.route({
    method: 'POST',
    url: '/time-intervals/bulk',
    // preHandler: verifyToken,
    handler: bulkCreateTimeIntervals
  });
  
  fastify.route({
    method: 'PUT',
    url: '/time-interval/:id',
    preHandler: verifyToken,
    handler: updateTimeInterval
  });
  
  fastify.route({
    method: 'DELETE',
    url: '/time-interval/:id',
    preHandler: verifyToken,
    handler: deleteTimeInterval
  });
};