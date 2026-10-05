"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const moment = require('moment');
const { QueryTypes } = require('sequelize');

async function getStaffSalaryHistory(query) {
  try {
    const filters = [];
    const salaryDate = moment(query.salaryDate);
    const today = moment();

    const isCurrentMonth = salaryDate.isSame(today, 'month') && salaryDate.isSame(today, 'year');
    const startOfMonth = salaryDate.clone().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = isCurrentMonth ? today.format('YYYY-MM-DD') : salaryDate.clone().endOf('month').format('YYYY-MM-DD');
    const monthStr = salaryDate.format('YYYY-MM');
    const salariedMonthStr = salaryDate.format('MMMM');

    if (query.staffId) filters.push(`st.staff_id = ${query.staffId}`);
    if (query.branchId) {
      if (query.branchId.includes(',')) {
        const branchIds = query.branchId.split(',').map(id => id.trim()).filter(id => id);
        if (branchIds.length) filters.push(`(${branchIds.map(id => `st.branch_id = ${id}`).join(' OR ')})`);
      } else filters.push(`st.branch_id = ${query.branchId}`);
    }
    if (query.departmentId !== undefined && query.departmentId !== '') {
      filters.push(`st.department_id = ${query.departmentId}`);
    }
    filters.push(`st.role_id != 1 AND st.is_active = 1`);
    const iql = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    const holidayDates = await sequelize.query(`
      SELECT holiday_date FROM holidays
      WHERE holiday_date BETWEEN :fromDate AND :toDate
    `, {
      type: QueryTypes.SELECT,
      replacements: { fromDate: startOfMonth, toDate: endOfMonth }
    });

    const holidayDateList = holidayDates.map(h => moment(h.holiday_date).format('YYYY-MM-DD'));

    const totalMonthDays = moment(startOfMonth).daysInMonth();
    const soFarDays = moment(endOfMonth).diff(moment(startOfMonth), 'days') + 1;
    const soFarOfficeDays = Array.from({ length: soFarDays }).reduce((acc, _, i) => {
      const date = moment(startOfMonth).add(i, 'days');
      if (date.day() !== 0 && !holidayDateList.includes(date.format('YYYY-MM-DD'))) acc++;
      return acc;
    }, 0);

    const totalSundays = Array.from({ length: soFarDays }).reduce((count, _, i) => {
      const date = moment(startOfMonth).add(i, 'days');
      return date.day() === 0 ? count + 1 : count;
    }, 0);

    const totalHolidays = holidayDateList.length;
    const totalHolidayAndSunday = totalSundays + totalHolidays;

    const deductionSettings = await sequelize.query(`
      SELECT setting_deduction_id AS settingDeductionId, deduction_value AS deductionValue,
          deduction_name AS deductionName, is_percentage AS isPercentage, is_increment AS isIncrement,
          is_deduction AS isDeduction
      FROM setting_deductions
      WHERE is_active = 1
    `, { type: QueryTypes.SELECT });

    const paidSalaries = await sequelize.query(`
      SELECT * FROM staff_salary_histories
      WHERE salaried_month = :salaryMonth
    `, {
      type: QueryTypes.SELECT,
      replacements: { salaryMonth: salariedMonthStr }
    });

    const paidMap = new Map();
    for (const paid of paidSalaries) {
      paidMap.set(paid.staff_id, paid);
    }

    const staffList = await sequelize.query(`
      SELECT 
        st.staff_id AS "staffId",
        CONCAT(st.first_name, ' ', st.last_name) AS "staffName",
        st.staff_code AS "staffCode", 
        st.department_id "departmentId",
        d.department_name "departmentName",
        st.designation_id "designationId" ,
        d2.designation_name "designationName",
        st.contact_no AS "contactNo",
        st.branch_id AS "branchId",
        st.role_id AS "roleId",
        st.staff_profile_image_name AS "staffProfile",
        st.pf_required as pfRequired, st.esi_required as esiRequired,
        sa.monthly_amount AS "monthlySalary",
        att.presentDays, att.halfDays, att.attendanceDates,
        adv.totalAdvance, adv.totalPaid
      FROM staffs st
      LEFT JOIN staff_salary_allocateds sa ON sa.staff_id = st.staff_id
      LEFT JOIN department d on d.department_id = st.department_id 
      LEFT JOIN designation d2 on d2.designation_id = st.designation_id 
      LEFT JOIN (
        SELECT staff_id, 
          GROUP_CONCAT(DATE(attendance_date)) AS attendanceDates,
          SUM(CASE WHEN attendance_status_id = 1 THEN 1 ELSE 0 END) AS presentDays,
          SUM(CASE WHEN attendance_status_id = 2 THEN 1 ELSE 0 END) AS halfDays
        FROM staff_attendances
        WHERE attendance_date BETWEEN :fromDate AND :toDate
          AND DAYOFWEEK(attendance_date) != 1
          ${holidayDateList.length ? 'AND attendance_date NOT IN (:holidayList)' : ''}
        GROUP BY staff_id
      ) AS att ON att.staff_id = st.staff_id
      LEFT JOIN (
        SELECT sa.staff_id,
          SUM(sa.amount) AS totalAdvance,
          SUM(COALESCE(aph.paid_amount, 0)) AS totalPaid
        FROM staff_advances sa
        LEFT JOIN advance_payment_histories aph ON aph.staff_advance_id = sa.staff_advance_id
        GROUP BY sa.staff_id
      ) AS adv ON adv.staff_id = st.staff_id
      ${iql}
      ORDER BY st.staff_id DESC
    `, {
      type: QueryTypes.SELECT,
      replacements: {
        fromDate: startOfMonth,
        toDate: endOfMonth,
        holidayList: holidayDateList.length ? holidayDateList : ['9999-12-31']
      }
    });

    const results = staffList.map((staff) => {
      const paidRecord = paidMap.get(staff.staffId);
      const attendanceDates = (staff.attendanceDates || '').split(',').filter(Boolean);
      const attendanceSet = new Set(attendanceDates);

      const allWorkingDays = Array.from({ length: soFarDays }).map((_, i) => {
        const date = moment(startOfMonth).add(i, 'days').format('YYYY-MM-DD');
        const isSunday = moment(date).day() === 0;
        const isHoliday = holidayDateList.includes(date);
        return !isSunday && !isHoliday ? date : null;
      }).filter(Boolean);

      const notEntryDates = allWorkingDays.filter(date => !attendanceSet.has(date));
      const notEntryCount = notEntryDates.length;

      const present = Number(staff.presentDays || 0);
      const half = Number(staff.halfDays || 0);
      const effectiveDays = (present) + (half * 0.5);
      const absentCount = allWorkingDays.length - effectiveDays - notEntryCount;

      const monthlySalary = Number(staff.monthlySalary || 0);
      const perDaySalary = monthlySalary / totalMonthDays;

      const presentDaySalary = Math.round((present + Number(totalHolidayAndSunday)) * perDaySalary);
      const halfDaySalary = Math.round(half * 0.5 * perDaySalary);
      const absentDaySalary = Math.round(absentCount * perDaySalary);
      const notAttendanceSalary = Math.round(notEntryCount * perDaySalary);
      const presentAndHalfDaySalary = Math.round(presentDaySalary + halfDaySalary);

      if (paidRecord) {
        const parsedSalaryDetails = JSON.parse(paidRecord.salary_details || '{}');
        const parsedAttendanceBasedSalary = JSON.parse(paidRecord.attendance_based_salary || '{}');
        const parsedAttendanceList = JSON.parse(paidRecord.attendance_list || '{}');
        const parsedDeductionDetails = JSON.parse(paidRecord.deduction_details || '{}');
        
        // Add ESI amount to deduction details if not present
        if (paidRecord.esi_amount && !parsedDeductionDetails.esiAmount) {
          parsedDeductionDetails.esiAmount = parseFloat(paidRecord.esi_amount);
        }

        return {
          ...staff,
          monthlySalary: parsedSalaryDetails?.monthlySalary || 0,
          netPayableSalary: parsedSalaryDetails?.netPayableSalary || 0,
          salariedMonth: paidRecord?.salaried_month || 0,
          totalAdvanceAmount: staff.totalAdvance || 0,
          totalPaidAdvanceAmount: staff.totalPaid || 0,
          balanceAdvanceAmount: (staff.totalAdvance || 0) - (staff.totalPaid || 0),
          deductionDetails: parsedDeductionDetails,
          esiAmount: parseFloat(paidRecord.esi_amount || 0),
          pfAmount: parseFloat(paidRecord.pf_amount || 0),

          attendanceBasedSalary: parsedAttendanceBasedSalary,
          presentDaySalary: parsedAttendanceBasedSalary?.presentDaySalary || 0,
          absentDaySalary: parsedAttendanceBasedSalary?.absentDaySalary || 0,
          halfDaySalary: parsedAttendanceBasedSalary?.halfDaySalary || 0,
          notAttendanceSalary: parsedAttendanceBasedSalary?.notAttendanceSalary || 0,
          presentAndHalfDaySalary: parsedAttendanceBasedSalary?.presentAndHalfDaySalary || 0,

          attendanceList: { ...parsedAttendanceList, totalHolidayAndSunday, totalDays: soFarDays },
          totalMonthDays: parsedAttendanceList?.totalMonthDays || 0,
          totalOfficeDays: parsedAttendanceList?.totalOfficeDays || 0,
          holidays: parsedAttendanceList?.holidays || 0,
          presentPlusHalfdays: parsedAttendanceList?.presentPlusHalfdays || 0,
          presentDays: parsedAttendanceList?.presentDays || 0,
          absentDays: parsedAttendanceList?.absentDays || 0,
          halfDays: parsedAttendanceList?.halfDays || 0,
          totalHolidayAndSunday,
          totalDays: soFarDays,
          attendanceNotEntryCount: parsedAttendanceList?.attendanceNotEntryCount || 0,

          salaryDetails: parsedSalaryDetails,
          status: 1
        };
      } else {
        const salaryBeforeDeduction = (effectiveDays + Number(totalHolidayAndSunday)) * perDaySalary;

        let totalDeduction = 0;
        let totalAllowance = 0;
        let esiAmount = 0;
        let pfAmount = 0;
        
        const deductionDetails = {
          totalDeduction: 0,
          totalAllowance: 0,
          totalIncrementAllowance: 0,
          totalIncludingAllowance: 0,
          deduction: [],
          allowance: [],
          esiAmount: 0,
          pfAmount: 0
        };

        deductionSettings.forEach(b => {
          const isPF = b.settingDeductionId === 1 && staff.pfRequired;
          const isESI = b.settingDeductionId === 2 && staff.esiRequired;
          const isOther = b.settingDeductionId > 2;

          if (isPF || isESI || isOther) {
            const deductionValue = Number(b.deductionValue || 0);
            const isPercentage = Number(b.isPercentage) === 1;
            const isDeduction = Number(b.isDeduction) === 1;
            const isIncrement = Number(b.isIncrement) === 1;

            const amount = isPercentage
              ? Math.round((salaryBeforeDeduction * deductionValue) / 100)
              : deductionValue;

            const item = {
              settingDeductionId: b.settingDeductionId,
              deductionValue: b.deductionValue,
              deductionAmount: amount,
              isPercentage: b.isPercentage,
              isDeduction: b.isDeduction,
              isIncrement: b.isIncrement,
              deductionName: b.deductionName
            };

            if (isESI) {
              esiAmount = amount;
              deductionDetails.esiAmount = amount;
            }
            if (isPF) {
              pfAmount = amount;
              deductionDetails.pfAmount = amount;
            }

            if (isDeduction) {
              totalDeduction += amount;
              deductionDetails.deduction.push({ [b.deductionName]: item });
            } else {
              if (isIncrement) {
                totalAllowance += amount;
              }
              deductionDetails.allowance.push({ [b.deductionName]: item });
            }
          }
        });

        let totalVisibleAllowance = 0;
        let totalIncrementAllowance = 0;
        deductionDetails.allowance.forEach(item => {
          const v = Object.values(item)[0];
          const amount = Number(v.deductionAmount || 0);
          totalVisibleAllowance += amount;
          if (Number(v.isIncrement) === 1) {
            totalIncrementAllowance += amount;
          }
        });

        deductionDetails.totalDeduction = totalDeduction;
        deductionDetails.totalAllowance = totalVisibleAllowance;
        deductionDetails.totalIncrementAllowance = totalIncrementAllowance;
        deductionDetails.totalIncludingAllowance = totalVisibleAllowance + totalIncrementAllowance;

        const finalSalary = Math.round(salaryBeforeDeduction + totalAllowance - totalDeduction);

        return {
          ...staff,
          monthlySalary,
          presentDays: present,
          halfDays: half,
          totalMonthDays,
          totalOfficeDays: soFarOfficeDays,
          holidays: holidayDateList.length,
          presentPlusHalfdays: effectiveDays,
          netPayableSalary: finalSalary,
          totalAdvanceAmount: staff.totalAdvance || 0,
          totalPaidAdvanceAmount: staff.totalPaid || 0,
          balanceAdvanceAmount: (staff.totalAdvance || 0) - (staff.totalPaid || 0),
          deductionDetails,
          esiAmount,
          pfAmount,
          totalHolidayAndSunday,
          totalDays: soFarDays,
          attendanceBasedSalary: {
            presentDaySalary,
            absentDaySalary,
            halfDaySalary,
            notAttendanceSalary,
            presentAndHalfDaySalary
          },
          attendanceList: {
            totalMonthDays,
            totalOfficeDays: soFarOfficeDays,
            holidays: holidayDateList.length,
            presentPlusHalfdays: effectiveDays,
            presentDays: present,
            totalDays: soFarDays,
            absentDays: Math.max(absentCount, 0),
            halfDays: half,
            attendanceNotEntryCount: notEntryCount,
          },
          salaryDetails: {
            pfRequired: staff.pfRequired,
            esiRequired: staff.esiRequired,
            monthlySalary,
            netPayableSalary: finalSalary,
            esiAmount,
            pfAmount
          },
          absentDays: Math.max(absentCount, 0),
          attendanceNotEntryCount: notEntryCount,
          presentDaySalary,
          halfDaySalary,
          absentDaySalary,
          notAttendanceSalary,
          presentAndHalfDaySalary,
          status: 0
        };
      }
    });

    return results;
  } catch (error) {
    console.error("Salary History Error:", error);
    throw new Error(error.message || "Operation error");
  }
}

async function createStaffSalaryHistory(postData) {
  try {
    const list = postData?.staffSalaryList;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Please select at least one staff member.");
    }

    for (const item of list) {
      const staffId = item.staffId;
      const salariedMonth = item.salariedMonth;

      if (!staffId || !salariedMonth) {
        continue;
      }

      const existing = await sequelize.models.staff_salary_history.findOne({
        where: {
          staff_id: staffId,
          salaried_month: salariedMonth,
        },
      });

      const payload = _.mapKeys(item, (value, key) => _.snakeCase(key));

      if (existing) {
        await sequelize.models.staff_salary_history.update(payload, {
          where: {
            staff_id: staffId,
            salaried_month: salariedMonth,
          },
        });
      } else {
        await sequelize.models.staff_salary_history.create(payload);
      }
    }

    return true;

  } catch (error) {
    console.error("Salary History Save Error:", error);
    throw new Error(error.message || "Operation error");
  }
}

async function getStaffSalaryHistoryDetails(query) {
  try {
    let iql = "";
    let count = 0;

    const year = moment(query.salaryDate).format('YYYY');
    const month = moment(query.salaryDate).format('MM');
    if (query && Object.keys(query).length) {
      iql += "WHERE";
      if (query.staffSalaryHistoryId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.staff_salary_history_id = ${query.staffSalaryHistoryId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
      if (query.salaryDate) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` (ts.salary_date LIKE '${moment(query.salaryDate).format('YYYY-MM')}%' OR ( ts.salary_date is null )) AND s.date_of_joining <= LAST_DAY(DATE_SUB('${moment(query.salaryDate).format('YYYY-MM-DD')}', INTERVAL -1 MONTH))`;
      }
      if (query.branchId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.branch_id = ${query.branchId}`;
      }
      if (query.departmentId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.department_id = ${query.departmentId}`;
      }
    }

    const result = await sequelize.query(`SELECT
        ts.staff_salary_history_id AS staffSalaryHistoryId,
        s.staff_id AS staffId,
        s.staff_code AS staffCode,
        s.pf_required AS pfRequired,
        s.esi_required AS esiRequired,
        CONCAT(s.first_name, ' ', s.last_name) AS staffName,
        ts.monthly_amount AS monthlyAmount,
        ts.salary_date AS salaryDate,
        ts.deduction_amount AS deductionAmount,
        ts.esi_amount AS esiAmount,
        b.branch_name as branchName,
        b.branch_id as branchId,
        d.department_name as departmentName,
        d.department_id as departmentId,
        ts.incentive_amount AS incentiveAmount,
        ts.food_allowance_amount AS foodAllowanceAmount,
        ts.tea_allowance_amount AS teaAllowanceAmount,
        ts.rent_allowance_amount AS rentAllowanceAmount,
        ts.bonus_amount AS bonusAmount,
        ts.other_deduction_amount AS otherDeductionAmount,
        ts.deduction_amount AS deductionAmount,
        ts.total_salary_amount AS totalSalaryAmount,
        ssa.annual_amount AS annualAmount,
        ssa.monthly_amount AS monthlyAmount,
        ssa.esi_amount AS esiAmount,
        ssa.pf_amount AS pfAmount,
        (select COALESCE(SUM(day_count),0) as day_count from staff_leaves  where staff_id=staffId and leave_type_id='27' and (YEAR(from_date) = '${year}' AND MONTH(from_date) = '${month}') or ( from_date is null ) ) AS sickLeaveCount,
        (select COALESCE(SUM(day_count),0) as day_count from staff_leaves  where staff_id=staffId and leave_type_id='26' and  (YEAR(from_date) = '${year}' AND MONTH(from_date) = '${month}') or ( from_date is null ) ) AS casualLeaveCount,
        (select COALESCE(SUM(amount), 0) as advanceAmt from staff_advances where staff_id = staffId ) AS advanceAmount,
        (select COALESCE(SUM(adv_his.paid_amount),0) as paidAmount from advance_payment_histories as adv_his left join staff_advances as st_adv on 
        st_adv.staff_advance_id = adv_his.staff_advance_id where st_adv.staff_id = staffId ) AS paidAdvanceAmount,
        ts.createdAt,DAY(LAST_DAY('${moment(query.salaryDate).format('YYYY-MM-DD')}')) AS workingDays
    FROM
        staffs s
    LEFT JOIN
        staff_salary_histories ts ON ts.staff_id = s.staff_id or ( ts.staff_id is null ) 
    LEFT JOIN
        branches b ON b.branch_id = s.branch_id
    LEFT JOIN
        department d ON d.department_id  = s.department_id 
    LEFT JOIN
        staff_attendances sa ON sa.staff_id = s.staff_id or ( sa.staff_id is null ) 
    LEFT JOIN
        staff_salary_allocateds ssa ON ssa.staff_id = s.staff_id or ( ssa.staff_id is null ) 
    LEFT JOIN
        staff_advances saa ON saa.staff_id = s.staff_id or ( saa.staff_id is null ) 
        ${iql}  GROUP BY 
        s.staff_id, 
        YEAR(ts.salary_date), 
        MONTH(ts.salary_date)
    ORDER BY 
        s.staff_id`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffSalaryHistory(staffSalaryHistoryId, putData) {
  try {
    if (putData.staffSalary.length == 1) {
      const excuteMethod = _.mapKeys(putData.staffSalary[0], (value, key) => _.snakeCase(key))
      const staffSalaryHistoryResult = await sequelize.models.staff_salary_history.update(excuteMethod, { where: { staff_salary_history_id: staffSalaryHistoryId } });
      const req = {
        salaryDate: staffSalaryHistoryResult?.salary_date,
        staffSalaryHistoryId: staffSalaryHistoryId
      }
      return await getStaffSalaryHistoryDetails(req);
    } else {
      console.log("bulk update called");
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaffSalaryHistory(salaryDate) {
  try {
    const staffSalaryHistoryResult = await sequelize.models.staff_salary_history.destroy({ where: { salary_date: salaryDate } });
    if (staffSalaryHistoryResult >= 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffSalaryHistory,
  getStaffSalaryHistoryDetails,
  updateStaffSalaryHistory,
  createStaffSalaryHistory
};