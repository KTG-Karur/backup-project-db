"use strict";

const sequelize = require('../models/index').sequelize;
const messages  = require("../helpers/message");
const { QueryTypes } = require('sequelize');
const moment    = require('moment');
const { sendFCMToMany } = require('../utils/fcm-notification');

// ─── Haversine distance (metres) ──────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R    = 6371000;
    const toRad = d => parseFloat(d) * Math.PI / 180;
    const φ1   = toRad(lat1), φ2 = toRad(lat2);
    const Δφ   = toRad(parseFloat(lat2) - parseFloat(lat1));
    const Δλ   = toRad(parseFloat(lon2) - parseFloat(lon1));
    const a    = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Fetch admin FCM tokens for a given branch ────────────────────────────────
async function _getAdminFcmTokens(branchId) {
    const rows = await sequelize.query(`
        SELECT DISTINCT bl.fcm_token
        FROM branch_locations bl
        INNER JOIN staffs s ON s.staff_id = bl.staff_id
        INNER JOIN role   r ON r.role_id  = s.role_id
        WHERE r.role_name IN ('Admin', 'admin', 'ADMIN', 'Super Admin')
          AND (bl.branch_id = ${parseInt(branchId)} OR s.branch_id IS NULL)
          AND bl.fcm_token IS NOT NULL
          AND bl.fcm_token != ''
    `, { type: QueryTypes.SELECT, raw: true });
    return rows.map(r => r.fcm_token).filter(Boolean);
}

// ─── POST /office-arrival ─────────────────────────────────────────────────────
/**
 * Direct office arrival submission from mobile app.
 *
 * Flow:
 *  1. Validate staff & branch exist
 *  2. Fetch branch lat/lon/allowed_radius
 *  3. Haversine check – ensure employee is within allowed_radius
 *  4. Create entry in branch_location_entry_logs
 *  5. Send FCM push to admins of that branch
 *
 * @param {object} data
 *   staffId, branchId, liveLatitude, liveLongitude,
 *   mobileModel?, batteryLevel?, fcmToken?, entryTime?
 */
async function submitOfficeArrival(data) {
    try {
        const {
            staffId, branchId,
            liveLatitude, liveLongitude,
            mobileModel, batteryLevel, fcmToken,
            entryTime: rawEntryTime
        } = data;

        // ── 1. Validate staff ───────────────────────────────────────────────
        const staff = await sequelize.models.staff.findOne({
            where: { staff_id: staffId },
            attributes: ['staff_id', 'first_name', 'last_name']
        });
        if (!staff) throw new Error(messages.INVALID_USER);

        const employeeName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();

        // ── 2. Validate branch & get coordinates ────────────────────────────
        const branch = await sequelize.models.branch.findOne({
            where: { branch_id: branchId },
            attributes: ['branch_id', 'branch_name', 'latitude', 'longitude', 'allowed_radius']
        });
        if (!branch) throw new Error(messages.DATA_NOT_FOUND + ' (branch)');

        if (!branch.latitude || !branch.longitude) {
            throw new Error('Branch location coordinates are not configured.');
        }

        // ── 3. Geofence check ───────────────────────────────────────────────
        const distMetres = haversineDistance(
            branch.latitude, branch.longitude,
            liveLatitude, liveLongitude
        );
        const radius = branch.allowed_radius || 100;

        const arrivalMoment = rawEntryTime ? moment(rawEntryTime) : moment();
        const arrivalTime   = arrivalMoment.format('YYYY-MM-DD HH:mm:ss');
        const arrivalDate   = arrivalMoment.format('YYYY-MM-DD');
        const arrivalLabel  = arrivalMoment.format('hh:mm A');

        const withinRadius = distMetres <= radius;
        const status       = withinRadius ? 'Location Reached' : 'Outside Radius';

        // Normalise battery
        let battery = null;
        if (batteryLevel !== undefined && batteryLevel !== null) {
            battery = `${String(batteryLevel).replace('%', '').trim()}%`;
        }

        // ── 4. Save entry log ───────────────────────────────────────────────
        const entryLog = await sequelize.models.branch_location_entry_log.create({
            staff_id:            parseInt(staffId),
            employee_name:       employeeName,
            branch_id:           parseInt(branchId),
            office_name:         branch.branch_name,
            entry_time:          arrivalTime,
            entry_date:          arrivalDate,
            distance_metres:     parseFloat(distMetres.toFixed(2)),
            mobile_model:        mobileModel   || null,
            battery_level:       battery,
            status,
            notification_status: 'pending'
        });

        let notificationResult = { success: false, reason: 'Outside geofence radius' };

        // ── 5. FCM to admins (only when within radius) ──────────────────────
        if (withinRadius) {
            const adminTokens = await _getAdminFcmTokens(branchId);
            if (fcmToken) adminTokens.unshift(fcmToken); // include employee's own token

            const uniqueTokens = [...new Set(adminTokens)].filter(Boolean);

            if (uniqueTokens.length > 0) {
                notificationResult = await sendFCMToMany(
                    uniqueTokens,
                    'Employee Reached Office',
                    `${employeeName} has reached ${branch.branch_name} at ${arrivalLabel}`,
                    {
                        entryLogId:     String(entryLog.id),
                        staffId:        String(staffId),
                        officeName:     branch.branch_name || '',
                        employeeName,
                        entryTime:      arrivalTime,
                        entryDate:      arrivalDate,
                        distanceMetres: String(distMetres.toFixed(2)),
                        mobileModel:    mobileModel  || '',
                        batteryLevel:   battery      || '',
                        type:           'office_arrival'
                    }
                );
            }

            const notifStatus = notificationResult.success ? 'sent' : 'failed';
            await sequelize.models.branch_location_entry_log.update(
                { notification_status: notifStatus, notification_sent_at: moment().toDate() },
                { where: { id: entryLog.id } }
            );
            entryLog.notification_status = notifStatus;
        }

        return {
            entryLogId:         entryLog.id,
            staffId:            parseInt(staffId),
            employeeName,
            branchId:           parseInt(branchId),
            branchName:         branch.branch_name,
            entryTime:          arrivalTime,
            entryDate:          arrivalDate,
            distanceMetres:     parseFloat(distMetres.toFixed(2)),
            allowedRadius:      radius,
            withinRadius,
            status,
            mobileModel:        mobileModel  || null,
            batteryLevel:       battery,
            notificationStatus: entryLog.notification_status,
            notificationResult: {
                success:      notificationResult.success,
                successCount: notificationResult.successCount,
                reason:       notificationResult.reason || null
            }
        };
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── POST /office-out ─────────────────────────────────────────────────────
/**
 * Mark when employee physically leaves office to start client visits.
 * Stamps travel_start_time for GPS distance calculation filtering.
 *
 * @param {number} entryLogId - Session ID from /office-arrival
 * @param {object} data - officeOutTime?, latitude?, longitude?, batteryLevel?
 */
async function submitOfficeOut(entryLogId, data) {
    try {
        const entryLog = await sequelize.models.branch_location_entry_log.findOne({
            where: { id: parseInt(entryLogId) },
            attributes: ['id', 'staff_id', 'session_status', 'travel_start_time']
        });

        if (!entryLog) throw new Error(messages.DATA_NOT_FOUND + ' (entry log)');
        if (entryLog.session_status === 'completed') {
            throw new Error('Session already completed.');
        }
        if (entryLog.travel_start_time) {
            throw new Error('Office Out already recorded for this session.');
        }

        const officeOutMoment = data.officeOutTime ? moment(data.officeOutTime) : moment();
        const officeOutTime   = officeOutMoment.format('YYYY-MM-DD HH:mm:ss');

        await sequelize.models.branch_location_entry_log.update(
            { travel_start_time: officeOutMoment.toDate() },
            { where: { id: parseInt(entryLogId) } }
        );

        try {
            await sequelize.models.TimeIntervals.create({
                staff_id:             entryLog.staff_id,
                time_status:          officeOutMoment.valueOf(),
                record_created_at:    officeOutMoment.valueOf(),
                latitude:             data.latitude  ? String(data.latitude)  : null,
                longitude:            data.longitude ? String(data.longitude) : null,
                action_type:          'Office Out-Tracker',
                attendance_mark_type: 2,
                coordinates_points:   data.latitude && data.longitude
                                        ? `${data.latitude},${data.longitude}` : null,
            });
        } catch (e) {
            console.error('time_intervals office-out companion write failed:', e.message);
        }

        return {
            entryLogId:      parseInt(entryLogId),
            travelStartTime: officeOutTime,
            message:         'Office Out recorded. GPS distance tracking begins from this point.'
        };
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

module.exports = { submitOfficeArrival, submitOfficeOut };
