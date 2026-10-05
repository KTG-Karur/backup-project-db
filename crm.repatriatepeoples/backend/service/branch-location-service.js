"use strict";

const sequelize = require('../models/index').sequelize;
const messages  = require("../helpers/message");
const _         = require('lodash');
const { QueryTypes } = require('sequelize');
const moment    = require('moment');
const { sendFCMToMany } = require('../utils/fcm-notification');

// ─── Haversine formula ────────────────────────────────────────────────────────
// Returns straight-line distance in metres between two GPS coordinates.
// Accurate to ~0.5 % – sufficient for office geofence checks.
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R    = 6371000; // Earth radius in metres
    const toRad = d => parseFloat(d) * Math.PI / 180;
    const φ1   = toRad(lat1), φ2 = toRad(lat2);
    const Δφ   = toRad(parseFloat(lat2) - parseFloat(lat1));
    const Δλ   = toRad(parseFloat(lon2) - parseFloat(lon1));
    const a    = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Internal: save entry log ─────────────────────────────────────────────────
async function _saveEntryLog(payload) {
    return sequelize.models.branch_location_entry_log.create(payload);
}

// ─── Internal: update entry log notification status ───────────────────────────
async function _markEntryLogNotification(logId, status) {
    await sequelize.models.branch_location_entry_log.update(
        { notification_status: status, notification_sent_at: moment().toDate() },
        { where: { id: logId } }
    );
}

// ─── GET ─────────────────────────────────────────────────────────────────────
async function getBranchLocation(query) {
    try {
        const conditions = [];

        if (query && Object.keys(query).length) {
            if (query.branchLocationId) conditions.push(`bl.id = ${parseInt(query.branchLocationId)}`);
            if (query.staffId)          conditions.push(`bl.staff_id = ${parseInt(query.staffId)}`);
            if (query.branchId)         conditions.push(`bl.branch_id = ${parseInt(query.branchId)}`);
            if (query.trackingStatus)   conditions.push(`bl.tracking_status = '${query.trackingStatus}'`);
            if (query.isActive !== undefined && query.isActive !== '')
                                        conditions.push(`bl.is_active = ${query.isActive}`);
            if (query.date)             conditions.push(`DATE(bl.createdAt) = '${query.date}'`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        return await sequelize.query(`
            SELECT
                bl.id                    "branchLocationId",
                bl.staff_id              "staffId",
                bl.employee_name         "employeeName",
                bl.branch_id             "branchId",
                bl.branch_name           "branchName",
                bl.registered_latitude   "registeredLatitude",
                bl.registered_longitude  "registeredLongitude",
                bl.live_latitude         "liveLatitude",
                bl.live_longitude        "liveLongitude",
                bl.role                  "role",
                bl.office_entry_time     "officeEntryTime",
                bl.tracking_status       "trackingStatus",
                bl.notification_status   "notificationStatus",
                bl.arrival_time          "arrivalTime",
                bl.fcm_token             "fcmToken",
                bl.location_radius       "locationRadius",
                bl.is_active             "isActive",
                bl.createdAt             "createdAt",
                bl.updatedAt             "updatedAt",
                s.first_name             "staffFirstName",
                s.last_name              "staffLastName",
                s.contact_no             "staffContactNo",
                b.address                "branchAddress",
                b.city                   "branchCity"
            FROM branch_locations bl
            LEFT JOIN staffs   s ON s.staff_id  = bl.staff_id
            LEFT JOIN branches b ON b.branch_id = bl.branch_id
            ${whereClause}
            ORDER BY bl.updatedAt DESC
        `, { type: QueryTypes.SELECT, raw: true, nest: false });
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
async function createBranchLocation(postData) {
    try {
        const data = _.mapKeys(postData, (v, k) => _.snakeCase(k));

        const staff = await sequelize.models.staff.findOne({
            where: { staff_id: data.staff_id },
            attributes: ['staff_id', 'first_name', 'last_name', 'contact_no']
        });
        if (!staff) throw new Error(messages.INVALID_USER);

        if (!data.employee_name)
            data.employee_name = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();

        if (data.branch_id && !data.branch_name) {
            const branch = await sequelize.models.branch.findOne({
                where: { branch_id: data.branch_id },
                attributes: ['branch_id', 'branch_name', 'address', 'city']
            });
            if (branch) data.branch_name = branch.branch_name;
        }

        const duplicate = await sequelize.models.branch_location.findOne({
            where: { staff_id: data.staff_id, branch_id: data.branch_id },
            attributes: ['id']
        });
        if (duplicate) throw new Error(messages.DUPLICATE_ENTRY);

        const record = await sequelize.models.branch_location.create(data);
        const rows   = await getBranchLocation({ branchLocationId: record.id });
        return rows[0] || null;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── PATCH – real-time GPS update + geofence check ───────────────────────────
/**
 * Called on every live-location ping from the mobile app.
 *
 * Flow:
 *  1. Update live GPS on branch_locations record
 *  2. Calculate Haversine distance vs registered office coordinates
 *  3. If distance ≤ radius AND not yet reached:
 *       a. Mark tracking_status = 'reached', stamp arrival_time
 *       b. Save entry log to branch_location_entry_logs
 *       c. Broadcast FCM to employee + admin (multicast)
 *       d. Record notification result on both records
 *
 * patchData fields:
 *   liveLatitude    {number}  required
 *   liveLongitude   {number}  required
 *   fcmToken        {string}  employee device token (optional)
 *   adminFcmToken   {string}  admin device token   (optional)
 *   mobileModel     {string}  device model name    (optional)
 *   batteryLevel    {string}  battery %            (optional)
 */
async function updateLiveLocation(branchLocationId, patchData) {
    try {
        const record = await sequelize.models.branch_location.findOne({
            where: { id: branchLocationId },
            attributes: [
                'id', 'staff_id', 'employee_name', 'branch_id', 'branch_name',
                'registered_latitude', 'registered_longitude',
                'live_latitude', 'live_longitude',
                'tracking_status', 'location_radius', 'fcm_token'
            ]
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        // ── 1. Prepare live-location update payload ───────────────────────────
        const update = {};
        if (patchData.liveLatitude  !== undefined) update.live_latitude  = patchData.liveLatitude;
        if (patchData.liveLongitude !== undefined) update.live_longitude = patchData.liveLongitude;
        if (patchData.fcmToken      !== undefined) update.fcm_token      = patchData.fcmToken;

        // ── 2. Geofence check ─────────────────────────────────────────────────
        const liveLat = patchData.liveLatitude  ?? record.live_latitude;
        const liveLon = patchData.liveLongitude ?? record.live_longitude;
        const regLat  = record.registered_latitude;
        const regLon  = record.registered_longitude;
        const radius  = record.location_radius || 100;

        const allCoordsPresent = liveLat && liveLon && regLat && regLon;
        const notYetReached    = record.tracking_status !== 'reached';

        if (allCoordsPresent && notYetReached) {
            const distMetres = haversineDistance(regLat, regLon, liveLat, liveLon);

            // ── 3. Employee is within geofence ────────────────────────────────
            if (distMetres <= radius) {
                const arrivalTime = moment().format('YYYY-MM-DD HH:mm:ss');
                const arrivalDate = moment().format('YYYY-MM-DD');
                const arrivalLabel = moment().format('hh:mm A');

                update.tracking_status = 'reached';
                update.arrival_time    = arrivalTime;

                // ── 3a. Save entry log ────────────────────────────────────────
                const entryLog = await _saveEntryLog({
                    branch_location_id: parseInt(branchLocationId),
                    staff_id:           record.staff_id,
                    employee_name:      record.employee_name,
                    branch_id:          record.branch_id,
                    office_name:        record.branch_name,
                    entry_time:         arrivalTime,
                    entry_date:         arrivalDate,
                    distance_metres:    parseFloat(distMetres.toFixed(2)),
                    mobile_model:       patchData.mobileModel   || null,
                    battery_level:      patchData.batteryLevel  || null,
                    status:             'Location Reached',
                    notification_status: 'pending'
                });

                // ── 3b. Broadcast FCM to employee + admin ─────────────────────
                const tokens = [
                    patchData.fcmToken    || record.fcm_token,
                    patchData.adminFcmToken || null
                ].filter(Boolean);

                if (tokens.length > 0) {
                    const notifResult = await sendFCMToMany(
                        tokens,
                        'Employee Reached Office',
                        `${record.employee_name} has arrived at ${record.branch_name} · ${arrivalLabel}`,
                        {
                            branchLocationId: String(branchLocationId),
                            entryLogId:       String(entryLog.id),
                            staffId:          String(record.staff_id),
                            officeName:       record.branch_name  || '',
                            employeeName:     record.employee_name || '',
                            entryTime:        arrivalTime,
                            entryDate:        arrivalDate,
                            distanceMetres:   String(distMetres.toFixed(2)),
                            mobileModel:      patchData.mobileModel  || '',
                            batteryLevel:     patchData.batteryLevel || '',
                            type:             'location_reached'
                        }
                    );

                    const notifStatus = notifResult.success ? 'sent' : 'failed';
                    update.notification_status = notifStatus;

                    // ── 3c. Update entry log notification result ───────────────
                    await _markEntryLogNotification(entryLog.id, notifStatus);
                } else {
                    // No tokens available – mark pending for later retry
                    update.notification_status = 'pending';
                }
            }
        }

        // ── 4. Persist updates to branch_locations ────────────────────────────
        await sequelize.models.branch_location.update(update, {
            where: { id: branchLocationId }
        });

        const rows = await getBranchLocation({ branchLocationId });
        return rows[0] || null;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── PUT – full record update ─────────────────────────────────────────────────
async function updateBranchLocation(branchLocationId, putData) {
    try {
        const record = await sequelize.models.branch_location.findOne({
            where: { id: branchLocationId },
            attributes: ['id']
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        const data = _.mapKeys(putData, (v, k) => _.snakeCase(k));
        await sequelize.models.branch_location.update(data, { where: { id: branchLocationId } });

        const rows = await getBranchLocation({ branchLocationId });
        return rows[0] || null;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteBranchLocation(branchLocationId) {
    try {
        const record = await sequelize.models.branch_location.findOne({
            where: { id: branchLocationId },
            attributes: ['id']
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        await sequelize.models.branch_location.destroy({ where: { id: branchLocationId } });
        return { branchLocationId: parseInt(branchLocationId), deleted: true };
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

module.exports = {
    getBranchLocation,
    createBranchLocation,
    updateLiveLocation,
    updateBranchLocation,
    deleteBranchLocation
};
