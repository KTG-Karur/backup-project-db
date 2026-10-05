"use strict";

const sequelize = require('../models/index').sequelize;
const messages  = require("../helpers/message");
const { QueryTypes } = require('sequelize');
const moment = require('moment');

// ─── Base fetch query ─────────────────────────────────────────────────────────
async function fetchEntryLogs(whereClause = '') {
    return sequelize.query(`
        SELECT
            el.id                    "entryLogId",
            el.branch_location_id    "branchLocationId",
            el.staff_id              "staffId",
            el.employee_name         "employeeName",
            el.branch_id             "branchId",
            el.office_name           "officeName",
            el.entry_time            "entryTime",
            el.entry_date            "entryDate",
            el.distance_metres       "distanceMetres",
            el.mobile_model          "mobileModel",
            el.battery_level         "batteryLevel",
            el.status                "status",
            el.notification_status   "notificationStatus",
            el.notification_sent_at  "notificationSentAt",
            el.createdAt             "createdAt",
            el.updatedAt             "updatedAt",
            el.total_distance_km     "totalKm",
            el.visit_out_time        "visitOutTime",
            el.visit_out_latitude    "visitOutLatitude",
            el.visit_out_longitude   "visitOutLongitude",
            s.staff_code             "staffCode",
            s.contact_no             "staffContactNo",
            CONCAT(s.first_name, ' ', s.last_name) "staffFullName",
            b.branch_name            "registeredBranchName",
            b.city                   "branchCity"
        FROM branch_location_entry_logs el
        LEFT JOIN staffs   s ON s.staff_id  = el.staff_id
        LEFT JOIN branches b ON b.branch_id = el.branch_id
        ${whereClause}
        ORDER BY el.entry_time DESC
    `, { type: QueryTypes.SELECT, raw: true, nest: false });
}

// ─── GET – entry logs with filters ───────────────────────────────────────────
async function getEntryLogs(query) {
    try {
        const conditions = [
            `ti.action_type IN ('Visit In-Tracker', 'Visit Out-Tracker')`
        ];
        const replacements = {};

        if (query.entryLogId) {
            // First find the staff_id and date for this time interval id
            const [tiRecord] = await sequelize.query(`
                SELECT staff_id, DATE_FORMAT(createdAt, '%Y-%m-%d') as logDate
                FROM time_intervals 
                WHERE id = :entryLogId
            `, {
                replacements: { entryLogId: parseInt(query.entryLogId) },
                type: QueryTypes.SELECT
            });
            if (tiRecord) {
                conditions.push(`ti.staff_id = :tiStaffId`);
                conditions.push(`DATE_FORMAT(ti.createdAt, '%Y-%m-%d') = :tiLogDate`);
                replacements.tiStaffId = tiRecord.staff_id;
                replacements.tiLogDate = tiRecord.logDate;
            } else {
                return [];
            }
        }

        if (query.staffId) {
            conditions.push(`ti.staff_id = :staffId`);
            replacements.staffId = parseInt(query.staffId);
        }

        if (query.branchId) {
            conditions.push(`s.branch_id = :branchId`);
            replacements.branchId = parseInt(query.branchId);
        }

        if (query.employeeName) {
            conditions.push(`CONCAT(s.first_name, ' ', s.last_name) LIKE :employeeName`);
            replacements.employeeName = `%${query.employeeName}%`;
        }

        if (query.date) {
            conditions.push(`DATE_FORMAT(ti.createdAt, '%Y-%m-%d') = :date`);
            replacements.date = query.date;
        }

        if (query.fromDate && query.toDate) {
            conditions.push(`DATE_FORMAT(ti.createdAt, '%Y-%m-%d') BETWEEN :fromDate AND :toDate`);
            replacements.fromDate = query.fromDate;
            replacements.toDate = query.toDate;
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const results = await sequelize.query(`
            SELECT 
                ti.id,
                ti.staff_id,
                ti.action_type,
                ti.latitude,
                ti.longitude,
                ti.client_form,
                ti.centre_no_name,
                ti.battery,
                ti.network_status,
                ti.brand,
                ti.model,
                ti.createdAt,
                ti.updatedAt,
                s.staff_code,
                s.contact_no,
                s.branch_id,
                CONCAT(s.first_name, ' ', s.last_name) AS staff_full_name,
                b.branch_name,
                b.city AS branch_city
            FROM time_intervals ti
            INNER JOIN staffs s ON s.staff_id = ti.staff_id
            LEFT JOIN branches b ON b.branch_id = s.branch_id
            ${whereClause}
            ORDER BY ti.staff_id ASC, ti.createdAt ASC
        `, {
            replacements,
            type: QueryTypes.SELECT,
            raw: true
        });

        const getDistance = (lat1, lon1, lat2, lon2) => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return parseFloat((R * c).toFixed(2));
        };

        const groups = {};
        for (const row of results) {
            const key = `${row.staff_id}_${moment(row.createdAt).format('YYYY-MM-DD')}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(row);
        }

        const entryLogs = [];
        for (const [key, rows] of Object.entries(groups)) {
            let currentVisit = null;
            for (const row of rows) {
                if (row.action_type === 'Visit In-Tracker') {
                    currentVisit = { visit_in: row };
                } else if (row.action_type === 'Visit Out-Tracker') {
                    if (currentVisit) {
                        currentVisit.visit_out = row;
                        
                        const lat1 = parseFloat(currentVisit.visit_in.latitude);
                        const lon1 = parseFloat(currentVisit.visit_in.longitude);
                        const lat2 = parseFloat(currentVisit.visit_out.latitude);
                        const lon2 = parseFloat(currentVisit.visit_out.longitude);
                        
                        const km = getDistance(lat1, lon1, lat2, lon2);
                        
                        entryLogs.push({
                            entryLogId: currentVisit.visit_in.id,
                            branchLocationId: null,
                            staffId: currentVisit.visit_in.staff_id,
                            employeeName: currentVisit.visit_in.staff_full_name,
                            branchId: currentVisit.visit_in.branch_id,
                            officeName: currentVisit.visit_out.client_form || currentVisit.visit_in.client_form || 'Client Visit',
                            entryTime: currentVisit.visit_in.createdAt,
                            entryDate: moment(currentVisit.visit_in.createdAt).format('YYYY-MM-DD'),
                            distanceMetres: parseFloat((km * 1000).toFixed(2)),
                            mobileModel: currentVisit.visit_in.model || currentVisit.visit_in.brand || 'Mobile',
                            batteryLevel: currentVisit.visit_in.battery ? `${currentVisit.visit_in.battery}%` : 'N/A',
                            status: currentVisit.visit_out.centre_no_name || currentVisit.visit_in.centre_no_name || 'Completed Visit',
                            notificationStatus: 'sent',
                            notificationSentAt: currentVisit.visit_in.createdAt,
                            createdAt: currentVisit.visit_in.createdAt,
                            updatedAt: currentVisit.visit_out.createdAt,
                            totalKm: km,
                            visitOutTime: currentVisit.visit_out.createdAt,
                            visitOutLatitude: currentVisit.visit_out.latitude,
                            visitOutLongitude: currentVisit.visit_out.longitude,
                            staffCode: currentVisit.visit_in.staff_code,
                            staffContactNo: currentVisit.visit_in.contact_no,
                            staffFullName: currentVisit.visit_in.staff_full_name,
                            registeredBranchName: currentVisit.visit_in.branch_name || 'N/A',
                            branchCity: currentVisit.visit_in.branch_city || 'N/A'
                        });
                        
                        currentVisit = null;
                    }
                }
            }
        }

        if (query.entryLogId) {
            return entryLogs.filter(log => log.entryLogId === parseInt(query.entryLogId));
        }

        // Sort descending by entryTime/createdAt
        return entryLogs.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── PUT – admin correction of an entry log ───────────────────────────────────
async function updateEntryLog(entryLogId, putData) {
    try {
        const record = await sequelize.models.branch_location_entry_log.findOne({
            where: { id: entryLogId },
            attributes: ['id']
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        const allowedFields = [
            'employee_name', 'office_name', 'entry_time', 'entry_date',
            'distance_metres', 'mobile_model', 'battery_level',
            'status', 'notification_status'
        ];

        const updatePayload = {};
        for (const [key, val] of Object.entries(putData)) {
            const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(snake)) updatePayload[snake] = val;
        }

        if (Object.keys(updatePayload).length === 0) {
            throw new Error('No valid fields provided for update.');
        }

        await sequelize.models.branch_location_entry_log.update(
            updatePayload,
            { where: { id: entryLogId } }
        );

        const rows = await fetchEntryLogs(`WHERE el.id = ${parseInt(entryLogId)}`);
        return rows[0] || null;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteEntryLog(entryLogId) {
    try {
        const record = await sequelize.models.branch_location_entry_log.findOne({
            where: { id: entryLogId },
            attributes: ['id']
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        await sequelize.models.branch_location_entry_log.destroy({ where: { id: entryLogId } });
        return { entryLogId: parseInt(entryLogId), deleted: true };
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

async function getVisitSummary(query) {
    try {
        if (!query.date) {
            throw new Error("date parameter is required (YYYY-MM-DD)");
        }
        const queryDate = query.date;

        const results = await sequelize.query(`
            SELECT 
                ti.id,
                ti.staff_id AS "user_id",
                CONCAT(s.first_name, ' ', s.last_name) AS "employee_name",
                ti.action_type AS "action_type",
                ti.latitude AS "latitude",
                ti.longitude AS "longitude",
                ti.createdAt AS "createdAt"
            FROM time_intervals ti
            INNER JOIN staffs s ON s.staff_id = ti.staff_id
            WHERE DATE_FORMAT(ti.createdAt, '%Y-%m-%d') = :queryDate
              AND ti.action_type IN ('Visit In-Tracker', 'Visit Out-Tracker')
              AND s.role_id != 1
            ORDER BY ti.staff_id ASC, ti.createdAt ASC
        `, {
            replacements: { queryDate },
            type: QueryTypes.SELECT,
            raw: true
        });

        const getDistance = (lat1, lon1, lat2, lon2) => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return parseFloat((R * c).toFixed(2));
        };

        const groups = {};
        for (const row of results) {
            if (!groups[row.user_id]) {
                groups[row.user_id] = {
                    employee_name: row.employee_name,
                    rows: []
                };
            }
            groups[row.user_id].rows.push(row);
        }

        const summaries = [];
        for (const [staffId, group] of Object.entries(groups)) {
            const sortedRows = group.rows;
            const completedVisits = [];
            let currentVisit = null;

            for (const row of sortedRows) {
                if (row.action_type === 'Visit In-Tracker') {
                    currentVisit = { visit_in: row };
                } else if (row.action_type === 'Visit Out-Tracker') {
                    if (currentVisit) {
                        currentVisit.visit_out = row;
                        
                        const lat1 = parseFloat(currentVisit.visit_in.latitude);
                        const lon1 = parseFloat(currentVisit.visit_in.longitude);
                        const lat2 = parseFloat(currentVisit.visit_out.latitude);
                        const lon2 = parseFloat(currentVisit.visit_out.longitude);
                        
                        currentVisit.km = getDistance(lat1, lon1, lat2, lon2);
                        completedVisits.push(currentVisit);
                        currentVisit = null;
                    }
                }
            }

            const totalKm = parseFloat(completedVisits.reduce((sum, v) => sum + v.km, 0).toFixed(2));
            summaries.push({
                user_id: parseInt(staffId),
                employee_name: group.employee_name,
                total_visits: completedVisits.length,
                total_km: totalKm
            });
        }

        return summaries;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

async function getVisitDetails(query) {
    try {
        if (!query.user_id || !query.date) {
            throw new Error("user_id and date parameters are required");
        }
        const userId = parseInt(query.user_id);
        const queryDate = query.date;
        const moment = require('moment');

        // Check if form_data column exists in time_intervals
        const tableInfo = await sequelize.query(
            `SHOW COLUMNS FROM time_intervals`,
            { type: QueryTypes.SELECT }
        );
        const hasFormData = tableInfo.some(col => col.Field === 'form_data');
        const formDataSelect = hasFormData ? 'ti.form_data,' : '';

        const results = await sequelize.query(`
            SELECT 
                ti.id,
                ti.action_type,
                ti.latitude,
                ti.longitude,
                ti.client_form,
                ti.centre_no_name,
                ti.member_name,
                ti.collection_amount,
                ti.cell_no_name,
                ti.attachment,
                ti.next_due_date,
                ti.branch_visit,
                ${formDataSelect}
                ti.createdAt
            FROM time_intervals ti
            WHERE ti.staff_id = :userId
              AND DATE_FORMAT(ti.createdAt, '%Y-%m-%d') = :queryDate
              AND ti.action_type IN ('Visit In-Tracker', 'Visit Out-Tracker')
            ORDER BY ti.createdAt ASC
        `, {
            replacements: { userId, queryDate },
            type: QueryTypes.SELECT,
            raw: true
        });

        const getDistance = (lat1, lon1, lat2, lon2) => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return parseFloat((R * c).toFixed(2));
        };

        const completedVisits = [];
        let currentVisit = null;

        for (const row of results) {
            if (row.action_type === 'Visit In-Tracker') {
                currentVisit = { visit_in: row };
            } else if (row.action_type === 'Visit Out-Tracker') {
                if (currentVisit) {
                    currentVisit.visit_out = row;
                    
                    const lat1 = parseFloat(currentVisit.visit_in.latitude);
                    const lon1 = parseFloat(currentVisit.visit_in.longitude);
                    const lat2 = parseFloat(currentVisit.visit_out.latitude);
                    const lon2 = parseFloat(currentVisit.visit_out.longitude);
                    
                    currentVisit.km = getDistance(lat1, lon1, lat2, lon2);
                    completedVisits.push(currentVisit);
                    currentVisit = null;
                }
            }
        }

        // Fetch geo-location tracking points for all completed visits
        const geoPointsByVisit = {};
        if (completedVisits.length > 0) {
            const overallStart = new Date(completedVisits[0].visit_in.createdAt);
            const overallEnd = new Date(completedVisits[completedVisits.length - 1].visit_out.createdAt);
            const overallStartMs = overallStart.getTime();
            const overallEndMs = overallEnd.getTime();

            // Query both time_intervals (punch/visit events) and staff_geolocations (auto-tracking)
            // Use actual event timestamps for ordering: createdAt for time_intervals, record_created_at for staff_geolocations
            const [tiGeoResults, sgGeoResults] = await Promise.all([
                sequelize.query(`
                    SELECT
                        CAST(ti.latitude AS DECIMAL(10,8)) as latitude,
                        CAST(ti.longitude AS DECIMAL(10,8)) as longitude,
                        UNIX_TIMESTAMP(ti.createdAt) * 1000 AS recordedAt
                    FROM time_intervals ti
                    WHERE ti.staff_id = :userId
                      AND ti.createdAt BETWEEN :startTime AND :endTime
                      AND ti.latitude IS NOT NULL
                      AND ti.longitude IS NOT NULL
                      AND ti.latitude != ''
                      AND ti.longitude != ''
                      AND ti.latitude != '0'
                      AND ti.longitude != '0'
                    ORDER BY ti.createdAt ASC
                `, {
                    replacements: { userId, startTime: overallStart, endTime: overallEnd },
                    type: QueryTypes.SELECT,
                    raw: true
                }),
                sequelize.query(`
                    SELECT
                        CAST(sg.latitude AS DECIMAL(10,8)) as latitude,
                        CAST(sg.longitude AS DECIMAL(10,8)) as longitude,
                        sg.record_createdAt AS recordedAt
                    FROM staff_geolocations sg
                    WHERE sg.staff_id = :userId
                      AND sg.record_createdAt BETWEEN :startTimeMs AND :endTimeMs
                      AND sg.latitude IS NOT NULL
                      AND sg.longitude IS NOT NULL
                      AND sg.latitude != ''
                      AND sg.longitude != ''
                      AND sg.latitude != '0'
                      AND sg.longitude != '0'
                    ORDER BY sg.record_createdAt ASC
                `, {
                    replacements: { userId, startTimeMs: overallStartMs, endTimeMs: overallEndMs },
                    type: QueryTypes.SELECT,
                    raw: true
                })
            ]);

            // Merge both result sets sorted by actual event time
            const allGeoResults = [...tiGeoResults, ...sgGeoResults].sort(
                (a, b) => a.recordedAt - b.recordedAt
            );

            // Remove duplicate coordinates (same lat/lng within short time intervals)
            const deduplicatedGeoResults = [];
            let lastCoord = null;
            for (const g of allGeoResults) {
                const currentCoord = `${parseFloat(g.latitude).toFixed(6)},${parseFloat(g.longitude).toFixed(6)}`;
                if (currentCoord !== lastCoord) {
                    deduplicatedGeoResults.push(g);
                    lastCoord = currentCoord;
                }
            }

            completedVisits.forEach(v => {
                const inTime = new Date(v.visit_in.createdAt).getTime();
                const outTime = new Date(v.visit_out.createdAt).getTime();
                const points = [];
                for (const g of deduplicatedGeoResults) {
                    const t = parseInt(g.recordedAt);
                    if (t >= inTime && t <= outTime) {
                        const lat = parseFloat(g.latitude);
                        const lng = parseFloat(g.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            points.push({
                                lat: lat,
                                lng: lng
                            });
                        }
                    }
                }
                geoPointsByVisit[v.visit_in.id] = points;
            });
        }

        const visits = completedVisits.map(v => {
            const inTime = moment(v.visit_in.createdAt);
            const outTime = moment(v.visit_out.createdAt);

            const visit_in = inTime.isValid() ? inTime.format('hh:mm A') : '';
            const visit_out = outTime.isValid() ? outTime.format('hh:mm A') : '';

            let duration = "00h 00m";
            const diffMs = outTime.diff(inTime);
            if (diffMs > 0) {
                const totalMins = Math.floor(diffMs / (1000 * 60));
                const hours = Math.floor(totalMins / 60);
                const mins = totalMins % 60;
                duration = `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
            }

            const inLat = parseFloat(v.visit_in.latitude);
            const inLng = parseFloat(v.visit_in.longitude);
            const outLat = parseFloat(v.visit_out.latitude);
            const outLng = parseFloat(v.visit_out.longitude);

            const visitInForm = v.visit_in;
            const visitOutForm = v.visit_out;
            let form_data = null;
            try {
                const raw = visitOutForm.form_data || visitInForm.form_data;
                form_data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (e) { form_data = null; }

            return {
                client_name: visitOutForm.client_form || visitInForm.client_form || 'Client Visit',
                centre_no_name: visitOutForm.centre_no_name || visitInForm.centre_no_name || '',
                member_name: visitOutForm.member_name || visitInForm.member_name || '',
                collection_amount: visitOutForm.collection_amount || visitInForm.collection_amount || '',
                cell_no_name: visitOutForm.cell_no_name || visitInForm.cell_no_name || '',
                attachment: visitOutForm.attachment || visitInForm.attachment || '',
                next_due_date: visitOutForm.next_due_date || visitInForm.next_due_date || '',
                branch_visit: visitOutForm.branch_visit || visitInForm.branch_visit || '',
                form_data,
                visit_in,
                visit_out,
                duration,
                km: v.km,
                visit_in_location: !isNaN(inLat) && !isNaN(inLng) ? { lat: inLat, lng: inLng } : null,
                visit_out_location: !isNaN(outLat) && !isNaN(outLng) ? { lat: outLat, lng: outLng } : null,
                route_points: geoPointsByVisit[v.visit_in.id] || []
            };
        });

        const total_km = parseFloat(visits.reduce((sum, v) => sum + v.km, 0).toFixed(2));

        return {
            summary: {
                total_visits: visits.length,
                total_km
            },
            visits
        };
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

module.exports = { getEntryLogs, updateEntryLog, deleteEntryLog, getVisitSummary, getVisitDetails };
