"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const moment = require('moment');
const { QueryTypes } = require('sequelize');

async function createClientVisit(data) {
  try {
    const entryLog = await sequelize.models.branch_location_entry_log.findOne({
      where: { id: parseInt(data.entryLogId) },
      attributes: ['id', 'staff_id', 'session_status']
    });

    if (!entryLog) throw new Error(messages.DATA_NOT_FOUND + ' (entry log)');
    if (entryLog.session_status !== 'active') {
      throw new Error('Session is not active.');
    }

    const existingCount = await sequelize.models.client_visit.count({
      where: { entry_log_id: parseInt(data.entryLogId) }
    });

    const visitSequence = existingCount + 1;

    const reachedTime = data.reachedTime ? moment(data.reachedTime) : moment();

    const clientVisit = await sequelize.models.client_visit.create({
      entry_log_id: parseInt(data.entryLogId),
      staff_id: entryLog.staff_id,
      visit_sequence: visitSequence,
      client_name: data.clientName,
      client_code: data.clientCode || null,
      contact_person: data.contactPerson || null,
      contact_no: data.contactNo || null,
      visit_category: data.visitCategory,
      reached_time: reachedTime.toDate(),
      reached_latitude: data.reachedLatitude ? parseFloat(data.reachedLatitude) : null,
      reached_longitude: data.reachedLongitude ? parseFloat(data.reachedLongitude) : null,
      form_data: data.formData || null,
      photo_url: data.photoUrl || null,
      status: 'pending'
    });

    await sequelize.models.branch_location_entry_log.increment('client_visits_count', {
      where: { id: parseInt(data.entryLogId) }
    });

    return {
      clientVisitId: clientVisit.client_visit_id,
      entryLogId: parseInt(data.entryLogId),
      clientName: clientVisit.client_name,
      visitSequence,
      status: 'pending',
      message: 'Client visit recorded successfully'
    };
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

async function getClientVisits(query) {
  try {
    const conditions = [];

    if (query.entryLogId) conditions.push(`cv.entry_log_id = ${parseInt(query.entryLogId)}`);
    if (query.staffId) conditions.push(`cv.staff_id = ${parseInt(query.staffId)}`);
    if (query.fromDate && query.toDate)
      conditions.push(`DATE(cv.reached_time) BETWEEN '${query.fromDate}' AND '${query.toDate}'`);
    if (query.visitCategory) conditions.push(`cv.visit_category = '${query.visitCategory}'`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await sequelize.query(`
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
        cv.createdAt "createdAt",
        cv.updatedAt "updatedAt",
        CONCAT(s.first_name, ' ', s.last_name) "staffFullName"
      FROM client_visits cv
      LEFT JOIN staffs s ON s.staff_id = cv.staff_id
      ${whereClause}
      ORDER BY cv.visit_sequence ASC
    `, { type: QueryTypes.SELECT, raw: true, nest: false });

    return result;
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

async function submitClientOut(clientVisitId, data) {
  try {
    const visit = await sequelize.models.client_visit.findOne({
      where: { client_visit_id: parseInt(clientVisitId) },
      attributes: ['client_visit_id', 'entry_log_id', 'departed_at']
    });

    if (!visit) throw new Error(messages.DATA_NOT_FOUND + ' (client visit)');
    if (visit.departed_at) throw new Error('Client Out already recorded for this visit.');

    const departedMoment = data.departedTime ? moment(data.departedTime) : moment();

    const updateData = { departed_at: departedMoment.toDate() };
    if (data.formData)  updateData.form_data  = data.formData;
    if (data.photoUrl)  updateData.photo_url  = data.photoUrl;

    await sequelize.models.client_visit.update(updateData, {
      where: { client_visit_id: parseInt(clientVisitId) }
    });

    return {
      clientVisitId: parseInt(clientVisitId),
      departedAt:    departedMoment.format('YYYY-MM-DD HH:mm:ss'),
      message:       'Client Out recorded successfully.'
    };
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

async function updateClientVisit(clientVisitId, data) {
  try {
    const visit = await sequelize.models.client_visit.findOne({
      where: { client_visit_id: parseInt(clientVisitId) },
      attributes: ['client_visit_id', 'entry_log_id', 'departed_at', 'form_data']
    });

    if (!visit) throw new Error(messages.DATA_NOT_FOUND + ' (client visit)');

    const updateData = {};

    if (data.clientForm || data.clientName)
      updateData.client_name = data.clientForm || data.clientName;
    if (data.clientCode)      updateData.client_code       = data.clientCode;
    if (data.memberName || data.contactPerson)
      updateData.contact_person = data.memberName || data.contactPerson;
    if (data.cellNoName || data.contactNo)
      updateData.contact_no = data.cellNoName || data.contactNo;
    if (data.centreNoName || data.visitCategory)
      updateData.visit_category = data.centreNoName || data.visitCategory;
    if (data.attachment || data.photoUrl)
      updateData.photo_url = data.attachment || data.photoUrl;

    if (data.formData) updateData.form_data = data.formData;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    await sequelize.models.client_visit.update(updateData, {
      where: { client_visit_id: parseInt(clientVisitId) }
    });

    return {
      clientVisitId: parseInt(clientVisitId),
      message: 'Client visit updated successfully.'
    };
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

module.exports = { createClientVisit, getClientVisits, submitClientOut, updateClientVisit };
