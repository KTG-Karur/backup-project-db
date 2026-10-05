"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const moment = require('moment')

// Returns { current, previous, change, trend }
// trend: 'up' | 'down' | 'same'
function compareValues(current, previous) {
    const cur = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    let change = 0;
    if (prev > 0) {
        change = parseFloat((((cur - prev) / prev) * 100).toFixed(2));
    } else if (cur > 0) {
        change = 100;
    }
    return {
        current: cur,
        previous: prev,
        change,
        trend: cur > prev ? 'up' : cur < prev ? 'down' : 'same'
    };
}

// async function getDashboard(query) {
//   try {

//     let iql = "";
//     let filter = [];

//     if (query && Object.keys(query).length) {
//       iql += `WHERE `;

//       if (query.branchId) {
//         if (query.branchId.includes(',')) {
//           const branchIds = query.branchId.split(',')
//             .map(id => id.trim())
//             .filter(id => id !== '');

//           if (branchIds.length > 0) {
//             const orConditions = branchIds.map(id => `lo.branch_id = ${id}`).join(' OR ');
//             filter.push(` (${orConditions})`);
//           }
//         } else {
//           filter.push(` lo.branch_id = ${query.branchId}`);
//         }
//       }

//       iql += filter.length > 0 ? filter.join(" AND ") : '';
//     }

//     const currentDate = moment().format('YYYY-MM-DD');
//     const prevWeekDate = moment().subtract(1, 'week').format('YYYY-MM-DD');

//     const [
//       staffLastOneWeekLeave,
//       attendanceData,
//       upComingBirthday,
//       roleCount,
//       branchCount,
//       activeAndClosedLoanCount,
//       previousActiveAndClosedLoanCount
//     ] = await Promise.all([

//       // Staff Leaves in Last 1 Week
//       sequelize.query(`
//         SELECT 
//           CONCAT(s.first_name,' ',s.last_name) AS staffName,
//           s.staff_profile_image_name as staffProfile,
//           sl.day_count AS dayCount,
//           sl.reason,
//           sl.from_date AS fromDate,
//           sl.to_date AS toDate
//         FROM staff_leaves sl
//         LEFT JOIN staffs s ON s.staff_id = sl.staff_id 
//         WHERE sl.from_date BETWEEN '${prevWeekDate}' AND '${currentDate}' 
//           AND sl.status_id = 29
//       `, { type: QueryTypes.SELECT, raw: true }),

//       // Attendance (Today)
//       sequelize.query(`
//         SELECT 
//           s.staff_id,
//           CONCAT(s.first_name, ' ', s.last_name) AS staffName,
//           s.staff_code AS staffCode,
//           s.staff_profile_image_name as staffProfile,
//           sa.attendance_status_id,
//           sl.staff_leave_id,
//           sl.status_id AS leave_status
//         FROM staffs s
//         LEFT JOIN staff_attendances sa 
//           ON s.staff_id = sa.staff_id AND sa.attendance_date = '${currentDate}'
//         LEFT JOIN staff_leaves sl 
//           ON s.staff_id = sl.staff_id 
//           AND '${currentDate}' BETWEEN sl.from_date AND sl.to_date
//         WHERE s.is_active = 1 and s.role_id != 1
//       `, { type: QueryTypes.SELECT, raw: true }),

//       // Upcoming Birthday
// sequelize.query(`
//   SELECT 
//     s.staff_id,
//     CONCAT(s.first_name, ' ', s.last_name) AS staffName,
//     s.dob AS DateOfBirth,
//     s.staff_profile_image_name as staffProfile,
//     s.staff_code AS staffCode,
//     CASE 
//       WHEN DATE_FORMAT(s.dob, '%m-%d') >= DATE_FORMAT(CURDATE(), '%m-%d') 
//       THEN DATE_FORMAT(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(s.dob, '%m-%d')), '%Y-%m-%d')
//       ELSE DATE_FORMAT(CONCAT(YEAR(CURDATE()) + 1, '-', DATE_FORMAT(s.dob, '%m-%d')), '%Y-%m-%d')
//     END AS nextBirthdayDate
//   FROM staffs s
//   WHERE s.is_active = 1
//   ORDER BY nextBirthdayDate
//   LIMIT 1
// `, { type: QueryTypes.SELECT, raw: true }),

//       // Role Count
//       sequelize.query(`
//         SELECT 
//           r.role_name AS roleName,
//           COUNT(s.staff_id) AS roleCount
//         FROM staffs s
//         LEFT JOIN role r ON r.role_id = s.role_id
//         WHERE r.role_name IS NOT NULL
//         GROUP BY r.role_name
//         ORDER BY r.role_name ASC
//       `, { type: QueryTypes.SELECT, raw: true }),

//       // Branch Count
//       sequelize.query(`
//         SELECT 
//           b.branch_name AS branchName,
//           COUNT(s.staff_id) AS branchCount
//         FROM staffs s
//         LEFT JOIN branches b ON b.branch_id = s.branch_id
//         WHERE s.branch_id IS NOT NULL
//         GROUP BY b.branch_name
//         ORDER BY b.branch_name ASC
//       `, { type: QueryTypes.SELECT, raw: true }),

//       // Loan Status Count
//       sequelize.query(`
//         SELECT
//           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeLoanCount,
//           SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS closedLoanCount
//         FROM staff_loans
//       `, { type: QueryTypes.SELECT, raw: true }),

//       // Loan Status Count
//       sequelize.query(`
//        SELECT
//     SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS prevActiveLoanCount,
//     SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS prevClosedLoanCount
//   FROM staff_loans
//   WHERE loan_date < DATE_FORMAT(NOW(), '%Y-%m-01')
//       `, { type: QueryTypes.SELECT, raw: true })

//     ]);

//     // Split Attendance Data
//     const presentEmployeeList = [];
//     const absentEmployeeList = [];
//     const attendanceNotEntryList = [];



//     attendanceData.forEach(row => {
//       const { staffName, staffProfile, staffCode, attendance_status_id, staff_leave_id, leave_status } = row;

//       if (attendance_status_id === 1) {
//         presentEmployeeList.push({ staffName, staffCode, staffProfile });
//       } else if (attendance_status_id === 0 || leave_status === 29 || attendance_status_id === 2) {
//         absentEmployeeList.push({ staffName, staffCode, staffProfile });
//       } else if (attendance_status_id === null && !staff_leave_id || leave_status === 28) {
//         attendanceNotEntryList.push({ staffName, staffCode, staffProfile });
//       }
//     });

//     const attendanceListCount = {
//       presentEmployeeCount: presentEmployeeList.length,
//       absentEmployeeCount: absentEmployeeList.length,
//       attendanceNotEntryCount: attendanceNotEntryList.length,
//     }



//     return {
//       staffLastOneWeekLeave,
//       attendanceListOut: {
//         presentEmployeeList,
//         absentEmployeeList,
//         attendanceNotEntryList,
//         attendanceListCount
//       },
//       upComingBirthday: upComingBirthday[0],
//       roleCount,
//       branchCount,
//       activeAndClosedLoanCount: {
//         activeLoanCount: activeAndClosedLoanCount[0].activeLoanCount || 0,
//         closedLoanCount: activeAndClosedLoanCount[0].closedLoanCount || 0,
//         prevActiveLoanCount: previousActiveAndClosedLoanCount[0].prevActiveLoanCount || 0,
//         prevClosedLoanCount: previousActiveAndClosedLoanCount[0].prevClosedLoanCount || 0
//       }
//     };

//   } catch (error) {
//     throw new Error(error.message || 'Dashboard load error');
//   }
// }

async function getDashboard(query) {
  try {
    let iql = "";
    let filter = [];

    if (query && Object.keys(query).length) {
      iql += `WHERE`;


      if (query.branchId) {
        if (query.branchId.includes(',')) {
          const branchIds = query.branchId.split(',')
            .map(id => id.trim())
            .filter(id => id !== '');
          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => ` s.branch_id = ${id}`).join(' OR ');
            filter.push(` (${orConditions})`);
          }
        } else {
          filter.push(` s.branch_id = ${query.branchId}`);
        }
      }

      iql += filter.length > 0 ? ' ' + filter.join(" AND ") : '';
    }

    const currentDate = moment().format('YYYY-MM-DD');
    const prevWeekDate = moment().subtract(1, 'week').format('YYYY-MM-DD');

    const [
      staffLastOneWeekLeave,
      attendanceData,
      upcomingBirthdayList,
      roleCount,
      branchCount,
      activeAndClosedLoanCount,
      previousActiveAndClosedLoanCount,
      employeeReachedData,
      kmTravelledData
    ] = await Promise.all([

      // Staff Leaves in Last 1 Week
      sequelize.query(`
        SELECT 
          CONCAT(s.first_name,' ',s.last_name) AS staffName,
          s.staff_profile_image_name as staffProfile,
          sl.day_count AS dayCount,
          sl.reason,
          sl.from_date AS fromDate,
          sl.to_date AS toDate
        FROM staff_leaves sl
        LEFT JOIN staffs s ON s.staff_id = sl.staff_id 
        ${iql ? iql + ' AND' : 'WHERE'} sl.from_date BETWEEN '${prevWeekDate}' AND '${currentDate}'
          AND sl.status_id = 29
      `, { type: QueryTypes.SELECT, raw: true }),

      // Attendance (Today)
      sequelize.query(`
        SELECT 
          s.staff_id,
          CONCAT(s.first_name, ' ', s.last_name) AS staffName,
          s.staff_code AS staffCode,
          s.staff_profile_image_name as staffProfile,
          sa.attendance_status_id,
          sl.staff_leave_id,
          sl.status_id AS leave_status
        FROM staffs s
        LEFT JOIN staff_attendances sa 
          ON s.staff_id = sa.staff_id AND sa.attendance_date = '${currentDate}'
        LEFT JOIN staff_leaves sl 
          ON s.staff_id = sl.staff_id 
          AND '${currentDate}' BETWEEN sl.from_date AND sl.to_date
        ${iql ? iql + ' AND' : 'WHERE'} s.is_active = 1 AND s.role_id != 1
      `, { type: QueryTypes.SELECT, raw: true }),

      // Upcoming Birthday — get closest MM-DD
      sequelize.query(`
        SELECT 
          s.staff_id,
          CONCAT(s.first_name, ' ', s.last_name) AS staffName,
          s.dob AS DateOfBirth,
          s.staff_profile_image_name as staffProfile,
          s.staff_code AS staffCode,
          CASE 
            WHEN DATE_FORMAT(s.dob, '%m-%d') >= DATE_FORMAT(CURDATE(), '%m-%d') 
            THEN DATE_FORMAT(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(s.dob, '%m-%d')), '%Y-%m-%d')
            ELSE DATE_FORMAT(CONCAT(YEAR(CURDATE()) + 1, '-', DATE_FORMAT(s.dob, '%m-%d')), '%Y-%m-%d')
          END AS nextBirthdayDate
        FROM staffs s
        WHERE s.is_active = 1
        ORDER BY nextBirthdayDate
        LIMIT 1
      `, { type: QueryTypes.SELECT, raw: true }),

      // Role Count
      sequelize.query(`
        SELECT 
          r.role_name AS roleName,
          COUNT(s.staff_id) AS roleCount
        FROM staffs s
        LEFT JOIN role r ON r.role_id = s.role_id
        WHERE r.role_name IS NOT NULL AND r.role_id != 1
        GROUP BY r.role_name
        ORDER BY r.role_name ASC
      `, { type: QueryTypes.SELECT, raw: true }),

      // Branch Count
      sequelize.query(`
        SELECT 
          b.branch_name AS branchName,
          COUNT(s.staff_id) AS branchCount
        FROM staffs s
        LEFT JOIN branches b ON b.branch_id = s.branch_id
        WHERE s.branch_id IS NOT NULL
        GROUP BY b.branch_name
        ORDER BY b.branch_name ASC
      `, { type: QueryTypes.SELECT, raw: true }),

      // Active vs Closed Loans
      sequelize.query(`
        SELECT
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeLoanCount,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS closedLoanCount
        FROM staff_loans
      `, { type: QueryTypes.SELECT, raw: true }),

      // Loans before current month
      sequelize.query(`
        SELECT
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS prevActiveLoanCount,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS prevClosedLoanCount
        FROM staff_loans
        WHERE loan_date < DATE_FORMAT(NOW(), '%Y-%m-01')
      `, { type: QueryTypes.SELECT, raw: true }),

      // Employee Reached — today vs yesterday
      sequelize.query(`
        SELECT
          SUM(CASE WHEN entry_date = '${currentDate}' AND status = 'Location Reached' THEN 1 ELSE 0 END) AS todayReachedCount,
          SUM(CASE WHEN entry_date = DATE_SUB('${currentDate}', INTERVAL 1 DAY) AND status = 'Location Reached' THEN 1 ELSE 0 END) AS prevReachedCount
        FROM branch_location_entry_logs
      `, { type: QueryTypes.SELECT, raw: true }),

      // Total KM Travelled — this month vs last month
      sequelize.query(`
        SELECT
          SUM(CASE WHEN tracking_date >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN total_distance_km ELSE 0 END) AS currentMonthKm,
          SUM(CASE WHEN tracking_date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
                    AND tracking_date <  DATE_FORMAT(NOW(), '%Y-%m-01') THEN total_distance_km ELSE 0 END) AS prevMonthKm
        FROM employee_tracking_reports
      `, { type: QueryTypes.SELECT, raw: true })

    ]);

    // Split Attendance Data
    // 0->Absent
    // 1->Present
    // 2->Half Day
    const presentEmployeeList = [];
    const absentEmployeeList = [];
    const halfDayEmployeeList = [];
    const attendanceNotEntryList = [];

    attendanceData.forEach(row => {
      const { staffName, staffProfile, staffCode, attendance_status_id, staff_leave_id, leave_status } = row;

      if (attendance_status_id === 1) {
        presentEmployeeList.push({ staffName, staffCode, staffProfile });
      } else if (attendance_status_id === 2) {
        halfDayEmployeeList.push({ staffName, staffCode, staffProfile });
      } else if (attendance_status_id === 0 || leave_status === 29) {
        absentEmployeeList.push({ staffName, staffCode, staffProfile });
      } else if (attendance_status_id === null && !staff_leave_id || leave_status === 28) {
        attendanceNotEntryList.push({ staffName, staffCode, staffProfile });
      }
    });

    const attendanceListCount = {
      presentEmployeeCount: presentEmployeeList.length,
      absentEmployeeCount: absentEmployeeList.length,
      halfDayEmployeeCount: halfDayEmployeeList.length,
      attendanceNotEntryCount: attendanceNotEntryList.length,
    }

    return {
      staffLastOneWeekLeave,
      attendanceListOut: {
        presentEmployeeList,
        absentEmployeeList,
        halfDayEmployeeList,
        attendanceNotEntryList,
        attendanceListCount
      },
      upComingBirthday: upcomingBirthdayList[0],
      roleCount,
      branchCount,
      activeAndClosedLoanCount: {
        activeLoan:  compareValues(activeAndClosedLoanCount[0].activeLoanCount,  previousActiveAndClosedLoanCount[0].prevActiveLoanCount),
        closedLoan:  compareValues(activeAndClosedLoanCount[0].closedLoanCount,  previousActiveAndClosedLoanCount[0].prevClosedLoanCount)
      },
      employeeReached: compareValues(
        employeeReachedData[0].todayReachedCount,
        employeeReachedData[0].prevReachedCount
      ),
      kmTravelled: compareValues(
        kmTravelledData[0].currentMonthKm,
        kmTravelledData[0].prevMonthKm
      )
    };

  } catch (error) {
    throw new Error(error.message || 'Dashboard load error');
  }
}



module.exports = {
  getDashboard,
};