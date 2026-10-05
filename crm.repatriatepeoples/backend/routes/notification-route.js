"use strict";
const Validator = require('fastest-validator')
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const notificationServices = require("../service/notification-service");
const _ = require('lodash');

// async function getNotification(req, res) {
//     const responseEntries = new ResponseEntry();
//     req.query.statusId = 28; // Pending status
    
//     try {
//         // Fetch all pending requests
//         const [permissions, leaves, petrolAllowances, claims] = await Promise.all([
//             permissionServices.getPermission(req.query),
//             staffLeaveServices.getStaffLeave(req.query),
//             petrolAllowanceServices.getPetrolAllowance(req.query),
//             claimServices.getClaim(req.query)
//         ]);

//         // Format notifications
//         const notifications = [];
        
//         // Permission notifications
//         if (permissions && permissions) {
//             permissions.forEach(item => {
//                 notifications.push({
//                     id: item.permissionId,
//                     type: 'permission',
//                     text: `New Permission Request from ${item.staffName}`,
//                     subText: `For: ${item.reason}`,
//                     route: `/view/permission`,
//                     date: item.createdAt
//                 });
//             });
//         }
        
//         // Leave notifications
//         if (leaves ) {
//             leaves.forEach(item => {
//                 notifications.push({
//                     id: item.staffLeaveId,
//                     type: 'leave',
//                     text: `New Leave Request from ${item.staffName}`,
//                     subText: `Type: ${item.leaveTypeName}, Days: ${item.dayCount}`,
//                     route: `/staff/staff-leave`,
//                     date: item.createdAt
//                 });
//             });
//         }
        
//         // Petrol Allowance notifications
//         if (petrolAllowances ) {
//             petrolAllowances.forEach(item => {
//                 notifications.push({
//                     id: item.petrolAllowanceId,
//                     type: 'petrol',
//                     text: `New Petrol Allowance Request from ${item.staffName}`,
//                     subText: `Distance: ${item.totalKm}km`,
//                     route: `/allowance/petrol-allowance`,
//                     date: item.createdAt
//                 });
//             });
//         }
        
//         // Claim notifications
//         if (claims) {
//             claims.forEach(item => {
//                 notifications.push({
//                     id: item.claimId,
//                     type: 'claim',
//                     text: `New Claim Request from ${item.requestedBy}`,
//                     subText: `Amount: ${item.requestedAmount}`,
//                     route: `/claim/claim-list`,
//                     date: item.createdAt
//                 });
//             });
//         }
        
//         // Sort by date (newest first)
//         notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
//         responseEntries.data = notifications;
        
//         if (!responseEntries.data || responseEntries.data.length === 0) {
//             responseEntries.message = messages.DATA_NOT_FOUND;
//         }
//     } catch (error) {
//         responseEntries.error = true;
//         responseEntries.message = error.message ? error.message : error;
//         responseEntries.code = responseCode.BAD_REQUEST;
//         res.status(responseCode.BAD_REQUEST);
//     } finally {
//         res.send(responseEntries);
//     }
// }

async function getNotification(req, res) {
    const responseEntries = new ResponseEntry();
    try {
        responseEntries.data = await notificationServices.getNotification(req.user.staffId);
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
        url: '/notification',
        preHandler: verifyToken,
        handler: getNotification
    });
};