"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const moment = require('moment');
const { QueryTypes } = require('sequelize');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => parseFloat(d) * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(parseFloat(lat2) - parseFloat(lat1));
  const Δλ = toRad(parseFloat(lon2) - parseFloat(lon1));
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function submitVisitOut(entryLogId, data) {
  try {
    const entryLog = await sequelize.models.branch_location_entry_log.findOne({
      where: { id: parseInt(entryLogId) },
      attributes: ['id', 'staff_id', 'session_status', 'travel_start_time']
    });

    if (!entryLog) throw new Error(messages.DATA_NOT_FOUND + ' (entry log)');
    if (entryLog.session_status === 'completed') {
      throw new Error('Session already completed.');
    }

    const travelFilter = entryLog.travel_start_time ? 'AND recorded_at >= ?' : '';
    const replacements = entryLog.travel_start_time
      ? [parseInt(entryLogId), entryLog.travel_start_time]
      : [parseInt(entryLogId)];

    const gpsTrails = await sequelize.query(`
      SELECT latitude, longitude, recorded_at
      FROM visit_gps_trails
      WHERE entry_log_id = ?
      ${travelFilter}
      ORDER BY recorded_at ASC
    `, { replacements, type: QueryTypes.SELECT, raw: true });

    const clientWindows = await sequelize.query(`
      SELECT reached_time AS arrived_at, departed_at
      FROM client_visits
      WHERE entry_log_id = ? AND departed_at IS NOT NULL
    `, { replacements: [parseInt(entryLogId)], type: QueryTypes.SELECT, raw: true });

    const travelTrails = clientWindows.length > 0
      ? gpsTrails.filter(point => {
          const t = new Date(point.recorded_at).getTime();
          return !clientWindows.some(w => {
            const a = new Date(w.arrived_at).getTime();
            const d = new Date(w.departed_at).getTime();
            return t >= a && t <= d;
          });
        })
      : gpsTrails;

    let totalDistanceKm = 0;
    if (travelTrails.length > 1) {
      for (let i = 1; i < travelTrails.length; i++) {
        const d = haversineDistance(
          travelTrails[i - 1].latitude,
          travelTrails[i - 1].longitude,
          travelTrails[i].latitude,
          travelTrails[i].longitude
        );
        totalDistanceKm += d / 1000;
      }
    }

    const visitOutMoment = data.visitOutTime ? moment(data.visitOutTime) : moment();
    const visitOutTime = visitOutMoment.format('YYYY-MM-DD HH:mm:ss');

    await sequelize.models.branch_location_entry_log.update(
      {
        visit_out_time: visitOutTime,
        visit_out_latitude: parseFloat(data.visitOutLatitude),
        visit_out_longitude: parseFloat(data.visitOutLongitude),
        total_distance_km: parseFloat(totalDistanceKm.toFixed(3)),
        session_status: 'completed'
      },
      { where: { id: parseInt(entryLogId) } }
    );

    try {
      await sequelize.models.TimeIntervals.create({
        staff_id:             entryLog.staff_id,
        time_status:          visitOutMoment.valueOf(),
        record_created_at:    visitOutMoment.valueOf(),
        latitude:             data.visitOutLatitude ? String(data.visitOutLatitude) : null,
        longitude:            data.visitOutLongitude ? String(data.visitOutLongitude) : null,
        action_type:          'Visit Out-Tracker',
        attendance_mark_type: 2,
        coordinates_points:   data.visitOutLatitude && data.visitOutLongitude
                                ? `${data.visitOutLatitude},${data.visitOutLongitude}` : null,
      });
    } catch (e) {
      console.error('time_intervals visit-out companion write failed:', e.message);
    }

    return {
      entryLogId: parseInt(entryLogId),
      visitOutTime,
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(3)),
      sessionStatus: 'completed',
      message: 'Visit Out recorded successfully'
    };
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

async function recordVisitGpsTrail(entryLogId, data) {
  try {
    const entryLog = await sequelize.models.branch_location_entry_log.findOne({
      where: { id: parseInt(entryLogId) },
      attributes: ['id', 'staff_id', 'session_status']
    });

    if (!entryLog) throw new Error(messages.DATA_NOT_FOUND + ' (entry log)');
    if (entryLog.session_status === 'completed') {
      throw new Error('Session already completed.');
    }

    const recordedAt = data.recordedAt ? moment(data.recordedAt) : moment();

    const gpsTrail = await sequelize.models.visit_gps_trail.create({
      entry_log_id: parseInt(entryLogId),
      staff_id: entryLog.staff_id,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      recorded_at: recordedAt.toDate(),
      battery_level: data.batteryLevel || null,
      speed_kmph: data.speed ? parseFloat(data.speed) : null,
      accuracy_meters: data.accuracy ? parseFloat(data.accuracy) : null
    });

    return {
      gpsId: gpsTrail.gps_id,
      recorded: true,
      message: 'GPS trail recorded'
    };
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

module.exports = { submitVisitOut, recordVisitGpsTrail };
