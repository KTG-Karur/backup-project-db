"use strict";
const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const staffGeolocationServices = require("../service/staff-geolocation-service");
const _ = require('lodash');

const schema = {
  staffId: { type: "number", optional: false },
}

async function getStaffGeolocations(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffGeolocationServices.getStaffGeolocations(req.query);
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

async function getStaffGeolocationDetails(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffGeolocationServices.getStaffGeolocationDetails(req.query);
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

async function createStaffGeolocation(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const validationResponse = await v.validate(req.body, schema)
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffGeolocationServices.createStaffGeolocation(req.body);
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

async function updateStaffGeolocation(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema)
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await staffGeolocationServices.updateStaffGeolocation(req.params.geoId, req.body);
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

async function deleteStaffGeolocation(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await staffGeolocationServices.deleteStaffGeolocation(req.params.geoId);
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


const bulkUploadSchema = {
  staffId: { type: "number", optional: false, integer: true, positive: true },
 
};

// Add bulk upload function
async function bulkCreateStaffGeolocations(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  
  try {
    const validationResponse = await v.validate(req.body, bulkUploadSchema);
    
    if (validationResponse !== true) {
      responseEntries.error = true;
      responseEntries.message = messages.VALIDATION_FAILED;
      responseEntries.validationErrors = validationResponse;
      responseEntries.code = responseCode.BAD_REQUEST;
      res.status(responseCode.BAD_REQUEST);
    } else {
      const { staffId, geolocations } = req.body;
      
      // Validate that geolocations array is not empty
      if (!geolocations || geolocations.length === 0) {
        throw new Error('Geolocations array cannot be empty');
      }
      
      // Limit the number of records per request (optional)
      const MAX_RECORDS = 1000;
      if (geolocations.length > MAX_RECORDS) {
        throw new Error(`Maximum ${MAX_RECORDS} records allowed per request`);
      }
      
      responseEntries.data = await staffGeolocationServices.bulkCreateStaffGeolocations(geolocations, staffId);
      
      if (responseEntries.data.failed > 0) {
        responseEntries.message = `Bulk upload completed with ${responseEntries.data.failed} failed records`;
        responseEntries.code = responseCode.PARTIAL_CONTENT;
        res.status(responseCode.PARTIAL_CONTENT);
      } else {
        responseEntries.message = `Successfully uploaded ${responseEntries.data.successful} records`;
      }
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



module.exports = async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/staff-geolocations',
    preHandler: verifyToken,
    handler: getStaffGeolocations
  });
  
  fastify.route({
    method: 'GET',
    url: '/staff-geolocation-details',
    preHandler: verifyToken,
    handler: getStaffGeolocationDetails
  });
  
  fastify.route({
    method: 'POST',
    url: '/staff-geolocation',
    // preHandler: verifyToken,
    handler: createStaffGeolocation
  });
  
  fastify.route({
    method: 'PUT',
    url: '/staff-geolocation/:geoId',
    preHandler: verifyToken,
    handler: updateStaffGeolocation
  });
  
  fastify.route({
    method: 'DELETE',
    url: '/staff-geolocation/:geoId',
    preHandler: verifyToken,
    handler: deleteStaffGeolocation
  });
  fastify.route({
    method: 'POST',
    url: '/staff-geolocations/bulk-upload',
    // preHandler: verifyToken, // Uncomment if you want authentication
    handler: bulkCreateStaffGeolocations
  });
};