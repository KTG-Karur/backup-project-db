'use strict';

const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const Validator = require("fastest-validator");
const v = new Validator();

// Import the service
const employeeTimeIntervalsServices = require("../service/employee-time-status-services");

async function getAllEmployeeTrackingHandler(req, res) {
    const responseEntries = new ResponseEntry();
    
    try {
        const { date } = req.query;
        
        // Validate input
        if (!date) {
            throw new Error("date parameter is required");
        }
        
        // Validate date format (YYYY-MM-DD)
        const dateSchema = {
            date: { 
                type: "string", 
                pattern: /^\d{4}-\d{2}-\d{2}$/,
                optional: false 
            }
        };
        
        const validationResponse = v.validate({ date }, dateSchema);
        if (validationResponse !== true) {
            throw new Error("Valid date parameter in YYYY-MM-DD format is required");
        }
        
        // Get data from service
        const trackingData = await employeeTimeIntervalsServices.getAllEmployeeTrackingWithStatus(date);
        
        if (!trackingData || trackingData.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
        } else {
            responseEntries.data = trackingData;
            responseEntries.message = "Employee tracking data retrieved successfully";
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

async function getAllEmployeeTrackingMongoHandler(req, res) {
    const responseEntries = new ResponseEntry();
    
    try {
        const { date } = req.query;
        
        // Validate input
        if (!date) {
            throw new Error("date parameter is required");
        }
        
        // Validate date format (YYYY-MM-DD)
        const dateSchema = {
            date: { 
                type: "string", 
                pattern: /^\d{4}-\d{2}-\d{2}$/,
                optional: false 
            }
        };
        
        const validationResponse = v.validate({ date }, dateSchema);
        if (validationResponse !== true) {
            throw new Error("Valid date parameter in YYYY-MM-DD format is required");
        }
        
        // Get data from service (MongoDB-like format)
        const trackingData = await employeeTimeIntervalsServices.getAllEmployeeTrackingMongoFormat(date);
        
        if (!trackingData || trackingData.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
        } else {
            responseEntries.data = trackingData;
            responseEntries.message = "Employee tracking data retrieved successfully";
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
async function getAllEmployeeTrackingAttence(req, res) {
    const responseEntries = new ResponseEntry();
    
    try {
    
        
        // Get data from service (MongoDB-like format)
        const trackingData = await employeeTimeIntervalsServices.getStaffAttendanceList(req.query);
        
        if (!trackingData || trackingData.length === 0) {
            responseEntries.message = messages.DATA_NOT_FOUND;
        } else {
            responseEntries.data = trackingData;
            responseEntries.message = "Employee attence data retrieved successfully";
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

// Export route setup function
module.exports = async function (fastify) {
    // Route 1: Get all employee tracking with status (simple format)
    // fastify.route({
    //     method: 'GET',
    //     url: '/all-employee-tracking',
    //     preHandler: verifyToken,
    //     schema: {
    //         querystring: {
    //             type: 'object',
    //             required: ['date'],
    //             properties: {
    //                 date: { 
    //                     type: 'string',
    //                     pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    //                     description: 'Date in YYYY-MM-DD format'
    //                 }
    //             }
    //         }
    //     },
    //     handler: getAllEmployeeTrackingHandler
    // });

    // Route 2: Get all employee tracking with status (MongoDB-like format)
    fastify.route({
        method: 'GET',
        url: '/all-employee-tracking/attence',
        // preHandler: verifyToken,
        schema: {
            querystring: {
                type: 'object',
                required: ['date'],
                properties: {
                    date: { 
                        type: 'string',
                        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                        description: 'Date in YYYY-MM-DD format'
                    }
                }
            }
        },
        handler: getAllEmployeeTrackingMongoHandler
    });
    fastify.route({
        method: 'GET',
        url: '/all-employee-tracking/mongo-format',
        // preHandler: verifyToken,
        
        handler: getAllEmployeeTrackingAttence
    });

    // // Route 3: Get individual staff tracking
    // fastify.route({
    //     method: 'GET',
    //     url: '/employee-tracking/:staffId',
    //     preHandler: verifyToken,
    //     schema: {
    //         params: {
    //             type: 'object',
    //             required: ['staffId'],
    //             properties: {
    //                 staffId: { type: 'string' }
    //             }
    //         },
    //         querystring: {
    //             type: 'object',
    //             required: ['date'],
    //             properties: {
    //                 date: { 
    //                     type: 'string',
    //                     pattern: '^\\d{4}-\\d{2}-\\d{2}$'
    //                 }
    //             }
    //         }
    //     },
    //     handler: async (req, res) => {
    //         const responseEntries = new ResponseEntry();
    //         try {
    //             const { staffId } = req.params;
    //             const { date } = req.query;
                
    //             if (!date) {
    //                 throw new Error("date parameter is required");
    //             }
                
    //             // Get time intervals
    //             const timeIntervals = await employeeTimeIntervalsServices.getTimeIntervalsForStaff(staffId, date);
                
    //             // Get latest geolocation
    //             const latestGeoLocation = await employeeTimeIntervalsServices.getLatestGeoLocation(staffId, date);
                
    //             // Get previous geolocation
    //             const previousGeoLocation = await employeeTimeIntervalsServices.getPreviousGeoLocation(staffId, date, latestGeoLocation?.createdAt);
                
    //             // Calculate movement status
    //             const movementStatus = employeeTimeIntervalsServices.calculateMovementStatus(latestGeoLocation, previousGeoLocation);
                
    //             // Get punch times
    //             const punchInTime = employeeTimeIntervalsServices.getPunchTime(timeIntervals, 'Punch In-Tracker');
    //             const punchOutTime = employeeTimeIntervalsServices.getPunchTime(timeIntervals, 'Punch Out-Tracker');
                
    //             // Get visit count
    //             const visitCount = employeeTimeIntervalsServices.getVisitCount(timeIntervals);
                
    //             responseEntries.data = {
    //                 staffId: staffId,
    //                 date: date,
    //                 punchInTime: punchInTime,
    //                 punchOutTime: punchOutTime,
    //                 movementStatus: movementStatus,
    //                 latestLocation: latestGeoLocation,
    //                 visitCount: visitCount,
    //                 totalTimeIntervals: timeIntervals.length,
    //                 timeIntervals: timeIntervals.slice(0, 10) // Return first 10 records
    //             };
                
    //         } catch (error) {
    //             responseEntries.error = true;
    //             responseEntries.message = error.message ? error.message : error;
    //             responseEntries.code = responseCode.BAD_REQUEST;
    //             res.status(responseCode.BAD_REQUEST);
    //         } finally {
    //             res.send(responseEntries);
    //         }
    //     }
    // });
};