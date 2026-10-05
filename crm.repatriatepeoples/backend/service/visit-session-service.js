"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const { QueryTypes } = require('sequelize');

async function getVisitSessions(query) {
  try {
    const conditions = ['el.session_status IS NOT NULL'];

    if (query.staffId) conditions.push(`el.staff_id = ${parseInt(query.staffId)}`);
    if (query.branchId) conditions.push(`el.branch_id = ${parseInt(query.branchId)}`);
    if (query.date) conditions.push(`el.entry_date = '${query.date}'`);
    if (query.fromDate && query.toDate)
      conditions.push(`el.entry_date BETWEEN '${query.fromDate}' AND '${query.toDate}'`);
    if (query.status) conditions.push(`el.session_status = '${query.status}'`);

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await sequelize.query(`
      SELECT
        el.id "entryLogId",
        el.staff_id "staffId",
        el.employee_name "employeeName",
        el.branch_id "branchId",
        el.office_name "officeName",
        el.entry_time "entryTime",
        el.entry_date "entryDate",
        el.visit_out_time "visitOutTime",
        el.visit_out_latitude "visitOutLatitude",
        el.visit_out_longitude "visitOutLongitude",
        el.total_distance_km "totalDistanceKm",
        el.session_status "sessionStatus",
        el.client_visits_count "clientVisitsCount",
        el.mobile_model "mobileModel",
        el.battery_level "batteryLevel",
        el.status "status",
        el.createdAt "createdAt",
        el.updatedAt "updatedAt",
        s.staff_code "staffCode",
        s.contact_no "staffContactNo",
        CONCAT(s.first_name, ' ', s.last_name) "staffFullName",
        b.branch_name "branchName"
      FROM branch_location_entry_logs el
      LEFT JOIN staffs s ON s.staff_id = el.staff_id
      LEFT JOIN branches b ON b.branch_id = el.branch_id
      ${whereClause}
      ORDER BY el.entry_time DESC
    `, { type: QueryTypes.SELECT, raw: true, nest: false });

    return result;
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

async function getVisitSessionDetail(entryLogId) {
  try {
    const sessionResult = await sequelize.query(`
      SELECT
        el.id "entryLogId",
        el.staff_id "staffId",
        el.employee_name "employeeName",
        el.branch_id "branchId",
        el.office_name "officeName",
        el.entry_time "entryTime",
        el.entry_date "entryDate",
        el.visit_out_time "visitOutTime",
        el.visit_out_latitude "visitOutLatitude",
        el.visit_out_longitude "visitOutLongitude",
        el.total_distance_km "totalDistanceKm",
        el.session_status "sessionStatus",
        el.client_visits_count "clientVisitsCount",
        el.mobile_model "mobileModel",
        el.battery_level "batteryLevel",
        el.status "status",
        s.staff_code "staffCode",
        s.contact_no "staffContactNo",
        CONCAT(s.first_name, ' ', s.last_name) "staffFullName",
        b.branch_name "branchName"
      FROM branch_location_entry_logs el
      LEFT JOIN staffs s ON s.staff_id = el.staff_id
      LEFT JOIN branches b ON b.branch_id = el.branch_id
      WHERE el.id = ?
    `, { replacements: [parseInt(entryLogId)], type: QueryTypes.SELECT, raw: true, nest: false });

    if (!sessionResult || sessionResult.length === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }

    const clientVisitsResult = await sequelize.query(`
      SELECT
        cv.client_visit_id "clientVisitId",
        cv.entry_log_id "entryLogId",
        cv.staff_id "staffId",
        cv.visit_sequence "visitSequence",
        cv.client_name "clientName",
        cv.client_code "clientCode",
        cv.contact_person "contactPerson",
        cv.contact_no "contactNo",
        cv.visit_category "visitCategory",
        cv.reached_time "reachedTime",
        cv.reached_latitude "reachedLatitude",
        cv.reached_longitude "reachedLongitude",
        cv.form_data "formData",
        cv.photo_url "photoUrl",
        cv.status "status",
        cv.createdAt "createdAt"
      FROM client_visits cv
      WHERE cv.entry_log_id = ?
      ORDER BY cv.visit_sequence ASC
    `, { replacements: [parseInt(entryLogId)], type: QueryTypes.SELECT, raw: true, nest: false });

    const gpsTrailResult = await sequelize.query(`
      SELECT
        vgt.gps_id "gpsId",
        vgt.latitude "latitude",
        vgt.longitude "longitude",
        vgt.recorded_at "recordedAt",
        vgt.battery_level "batteryLevel",
        vgt.speed_kmph "speedKmph",
        vgt.accuracy_meters "accuracyMeters"
      FROM visit_gps_trails vgt
      WHERE vgt.entry_log_id = ?
      ORDER BY vgt.recorded_at ASC
    `, { replacements: [parseInt(entryLogId)], type: QueryTypes.SELECT, raw: true, nest: false });

    return {
      session: sessionResult[0],
      clientVisits: clientVisitsResult,
      gpsTrail: gpsTrailResult
    };
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

module.exports = { getVisitSessions, getVisitSessionDetail };
