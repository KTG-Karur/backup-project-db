"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes, Op } = require('sequelize');
const moment = require('moment');

// ─────────────────────────────────────────────────────────────────────────────
// Base SELECT query used by all GET operations
// ─────────────────────────────────────────────────────────────────────────────
async function fetchReports(whereClause = '') {
    const result = await sequelize.query(`
        SELECT
            etr.id                      "reportId",
            etr.staff_id                "staffId",
            etr.employee_name           "employeeName",
            etr.tracking_date           "trackingDate",
            etr.total_distance_km       "totalDistanceKm",
            etr.mobile_model            "mobileModel",
            etr.battery_level           "batteryLevel",
            etr.tracking_start_time     "trackingStartTime",
            etr.tracking_end_time       "trackingEndTime",
            etr.is_active               "isActive",
            etr.createdAt               "createdAt",
            etr.updatedAt               "updatedAt",
            s.staff_code                "staffCode",
            s.contact_no                "staffContactNo",
            s.email_id                  "staffEmail",
            d.designation_name          "designation",
            b.branch_name               "branchName",
            TIMESTAMPDIFF(
                MINUTE,
                etr.tracking_start_time,
                etr.tracking_end_time
            )                           "totalDurationMinutes"
        FROM employee_tracking_reports etr
        LEFT JOIN staffs      s  ON s.staff_id       = etr.staff_id
        LEFT JOIN designation d  ON d.designation_id = s.designation_id
        LEFT JOIN branches    b  ON b.branch_id      = s.branch_id
        ${whereClause}
        ORDER BY etr.tracking_date DESC, etr.tracking_start_time DESC
    `, { type: QueryTypes.SELECT, raw: true, nest: false });

    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET – fetch reports filtered by employeeName and/or date
// ─────────────────────────────────────────────────────────────────────────────
async function getEmployeeTrackingReport(query) {
    try {
        const conditions = [];

        if (query.reportId)      conditions.push(`etr.id = ${parseInt(query.reportId)}`);
        if (query.staffId)       conditions.push(`etr.staff_id = ${parseInt(query.staffId)}`);

        // Filter by employee name (case-insensitive partial match)
        if (query.employeeName) {
            const safeName = query.employeeName.replace(/'/g, "''");
            conditions.push(`etr.employee_name LIKE '%${safeName}%'`);
        }

        // Filter by exact date  e.g. date=2026-05-15
        if (query.date) {
            conditions.push(`etr.tracking_date = '${query.date}'`);
        }

        // Optional date-range filter
        if (query.fromDate && query.toDate) {
            conditions.push(
                `etr.tracking_date BETWEEN '${query.fromDate}' AND '${query.toDate}'`
            );
        }

        if (query.isActive !== undefined && query.isActive !== '') {
            conditions.push(`etr.is_active = ${query.isActive}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        return await fetchReports(whereClause);
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST – save a new tracking session/report
// ─────────────────────────────────────────────────────────────────────────────
async function createEmployeeTrackingReport(postData) {
    try {
        const data = _.mapKeys(postData, (v, k) => _.snakeCase(k));

        // Auto-fill employee name from staff record when not supplied
        if (data.staff_id && !data.employee_name) {
            const staff = await sequelize.models.staff.findOne({
                where: { staff_id: data.staff_id }
            });
            if (!staff) throw new Error(messages.INVALID_USER);
            data.employee_name = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
        }

        if (!data.employee_name) throw new Error(messages.VALIDATION_FAILED);

        // Default tracking_date to today when not provided
        if (!data.tracking_date) {
            data.tracking_date = moment().format('YYYY-MM-DD');
        }

        // Normalise battery_level to always store as plain percentage string
        if (data.battery_level !== undefined && data.battery_level !== null) {
            const raw = String(data.battery_level).replace('%', '').trim();
            data.battery_level = `${raw}%`;
        }

        const record = await sequelize.models.employee_tracking_report.create(data);
        const rows = await fetchReports(`WHERE etr.id = ${record.id}`);
        return rows[0] || null;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT – update an existing tracking session
// ─────────────────────────────────────────────────────────────────────────────
async function updateEmployeeTrackingReport(reportId, putData) {
    try {
        const record = await sequelize.models.employee_tracking_report.findOne({
            where: { id: reportId }
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        const data = _.mapKeys(putData, (v, k) => _.snakeCase(k));

        // Normalise battery_level
        if (data.battery_level !== undefined && data.battery_level !== null) {
            const raw = String(data.battery_level).replace('%', '').trim();
            data.battery_level = `${raw}%`;
        }

        await sequelize.models.employee_tracking_report.update(data, {
            where: { id: reportId }
        });

        const rows = await fetchReports(`WHERE etr.id = ${reportId}`);
        return rows[0] || null;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE – remove a tracking report
// ─────────────────────────────────────────────────────────────────────────────
async function deleteEmployeeTrackingReport(reportId) {
    try {
        const record = await sequelize.models.employee_tracking_report.findOne({
            where: { id: reportId }
        });
        if (!record) throw new Error(messages.DATA_NOT_FOUND);

        await sequelize.models.employee_tracking_report.destroy({
            where: { id: reportId }
        });

        return { reportId: parseInt(reportId), deleted: true };
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY – aggregate total KM per employee for a given date range
// Used by the summary endpoint to calculate total kilometers traveled
// ─────────────────────────────────────────────────────────────────────────────
async function getTrackingKmSummary(query) {
    try {
        const conditions = [];

        if (query.staffId)     conditions.push(`etr.staff_id = ${parseInt(query.staffId)}`);
        if (query.employeeName) {
            const safeName = query.employeeName.replace(/'/g, "''");
            conditions.push(`etr.employee_name LIKE '%${safeName}%'`);
        }
        if (query.date)        conditions.push(`etr.tracking_date = '${query.date}'`);
        if (query.fromDate && query.toDate) {
            conditions.push(
                `etr.tracking_date BETWEEN '${query.fromDate}' AND '${query.toDate}'`
            );
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await sequelize.query(`
            SELECT
                etr.staff_id                            "staffId",
                etr.employee_name                       "employeeName",
                COUNT(etr.id)                           "totalSessions",
                SUM(etr.total_distance_km)              "totalKmTraveled",
                MIN(etr.tracking_date)                  "firstTrackingDate",
                MAX(etr.tracking_date)                  "lastTrackingDate",
                MIN(etr.tracking_start_time)            "earliestStartTime",
                MAX(etr.tracking_end_time)              "latestEndTime",
                SUM(
                    TIMESTAMPDIFF(
                        MINUTE,
                        etr.tracking_start_time,
                        etr.tracking_end_time
                    )
                )                                       "totalDurationMinutes",
                s.staff_code                            "staffCode",
                b.branch_name                           "branchName"
            FROM employee_tracking_reports etr
            LEFT JOIN staffs   s ON s.staff_id  = etr.staff_id
            LEFT JOIN branches b ON b.branch_id = s.branch_id
            ${whereClause}
            GROUP BY etr.staff_id, etr.employee_name, s.staff_code, b.branch_name
            ORDER BY SUM(etr.total_distance_km) DESC
        `, { type: QueryTypes.SELECT, raw: true, nest: false });

        return result;
    } catch (error) {
        throw new Error(error.message || messages.OPERATION_ERROR);
    }
}

module.exports = {
    getEmployeeTrackingReport,
    createEmployeeTrackingReport,
    updateEmployeeTrackingReport,
    deleteEmployeeTrackingReport,
    getTrackingKmSummary
};
