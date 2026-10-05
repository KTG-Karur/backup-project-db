'use strict';
const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const employeeTimeIntervalsServices = require("../service/employee-time-intervals-service");
const _ = require('lodash');

const schema = {
  staffId: { type: "string", optional: false },
  date: { type: "string", optional: false }
}


async function getEmployeeTracking(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator()
  
  try {
    const validationResponse = await v.validate(req.query, schema)
    if (validationResponse !== true) {
      throw new Error("staffId and date parameters are required");
    }

    responseEntries.data = await employeeTimeIntervalsServices.getEmployeeTracking(req.query);
    
    if (!responseEntries.data || Object.keys(responseEntries.data).length === 0) {
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
async function getAllEmployeeTracking(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  
  try {
    const { date } = req.query;
    
    if (!date) {
      throw new Error("date parameter is required");
    }
    
    // Validate date format if needed
    const dateSchema = {
      date: {
        type: "string",
        optional: false
      }
    };
    
    const validationResponse = await v.validate({ date }, dateSchema);
    if (validationResponse !== true) {
      throw new Error("Valid date parameter is required");
    }
    
    responseEntries.data = await employeeTimeIntervalsServices.getAllEmployeeTracking(date);
    
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

// Add this function to your routes file
async function getProductivityHistory(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  
  try {
    const { staffId, date, fromDate, toDate } = req.query;
    
    if (!staffId) {
      throw new Error("staffId parameter is required");
    }
    
    const hasSingleDate = !!date;
    const hasDateRange = !!fromDate && !!toDate;
    
    if (!hasSingleDate && !hasDateRange) {
      throw new Error("Either date or both fromDate and toDate parameters are required");
    }

    const validationResponse = await v.validate({ staffId }, {
      staffId: { type: "string", optional: false }
    });

    if (validationResponse !== true) {
      throw new Error("Valid staffId parameter is required");
    }

    responseEntries.data = await employeeTimeIntervalsServices.getProductivityHistory(
      staffId, date, fromDate, toDate
    );
    
    if (!responseEntries.data || 
        (!responseEntries.data.productivityHistory || 
         responseEntries.data.productivityHistory.length === 0)) {
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

// Add this function to your routes file
async function getAllStaffProductivitySummary(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  
  try {
    const { date, page, limit } = req.query;
    
    if (!date) {
      throw new Error("date parameter is required");
    }

    // Validate date parameter
    const validationResponse = await v.validate({ date }, {
      date: { type: "string", optional: false },
      page: { type: "number", optional: true, min: 1 },
      limit: { type: "number", optional: true, min: 1, max: 100 }
    });

    if (validationResponse !== true) {
      throw new Error("Valid date parameter is required");
    }

    // Get productivity summary for all staff
    responseEntries.data = await employeeTimeIntervalsServices.getAllStaffProductivitySummary(date);
    
    // Apply pagination if requested
    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      responseEntries.data.records = responseEntries.data.records.slice(startIndex, endIndex);
      responseEntries.data.currentPage = pageNum;
      responseEntries.data.totalPages = Math.ceil(responseEntries.data.totalCount / limitNum);
    }
    
    if (!responseEntries.data || responseEntries.data.totalCount === 0) {
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

module.exports = async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/employee-tracking',
    // preHandler: verifyToken,
    handler: getEmployeeTracking
  });
  fastify.route({
    method: 'GET',
    url: '/all-employee-tracking',
    // preHandler: verifyToken,
    handler: getAllEmployeeTracking
  });
   fastify.route({
    method: 'GET',
    url: '/productivity-history',
    // preHandler: verifyToken,
    handler: getProductivityHistory
  });

  fastify.route({
    method: 'GET',
    url: '/all-staff-productivity-summary',
    // preHandler: verifyToken,
    handler: getAllStaffProductivitySummary
  });
};