"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber } = require('../utils/utility');

async function getStaffAdvance(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffAdvanceId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.staff_advance_id = ${query.staffAdvanceId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
    //   if (query.branchId) {
    //     iql += count >= 1 ? ` AND` : ``;
    //     count++;
    //     iql += ` ts.branch_id = ${query.branchId}`;
    //   }
 
    if (query.branchId) {
      iql += count >= 1 ? ` AND` : ``;
      count++;
      if (query.branchId.includes(',')) {
          const branchIds = query.branchId.split(',')
              .map(id => id.trim())
              .filter(id => id !== ''); 
          
          if (branchIds.length > 0) {
              const orConditions = branchIds.map(id => `ts.branch_id = ${id}`).join(' OR ');
              iql += ` (${orConditions})`;
          }
      } else {
          iql += ` ts.branch_id = ${query.branchId}`;
      }
  }
}
    const result = await sequelize.query(`SELECT ts.staff_advance_id "staffAdvanceId",
      ts.staff_id "staffId",CONCAT(s.first_name,' ',s.last_name) as staffName,
      ts.apply_date "applyDate", ts.approved_date "approvedDate",
      ts.amount "amount", ts.reason "reason", ts.branch_id "branchId", ts.status_id "statusId",ts.is_active "isActive", ts.paid_amount "paidAmount", ts.balance_amount "balanceAmount", ts.status_id "statusId",
      ts.approved_by "	approvedById",CONCAT(s.first_name,' ',s.last_name) as 	approvedBy,
      ts.createdAt, COALESCE(SUM(ph.paid_amount), 0) AS "paidAmount"
      FROM staff_advances ts
      left join staffs s on s.staff_id = ts.staff_id 
      left join staffs s2 on s2.staff_id = ts.approved_by
      left join advance_payment_histories ph on ph.staff_advance_id = ts.staff_advance_id ${iql} GROUP BY 
    ts.staff_advance_id, ts.staff_id, ts.apply_date, ts.approved_date, ts.amount, 
    ts.reason, ts.paid_amount, ts.balance_amount, ts.status_id, ts.approved_by, 
    s.first_name, s.last_name, s2.first_name, s2.last_name, ts.createdAt;`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}


async function getStaffAdvanceLedger(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffAdvanceId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` ts.staff_advance_id = ${query.staffAdvanceId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` s.staff_id = ${query.staffId}`;
      }
    }
    const result = await sequelize.query(`SELECT 
    CONCAT(s.first_name, ' ', s.last_name) AS "staffName",
    s.staff_code AS "staffCode",
    s.staff_id AS "staffId",
    s.contact_no AS "contactNo",
    dep.department_name "departmentName",
    des.designation_name "designationName",
    b.branch_name "branchName",
    t.date AS "date",
    CASE 
        WHEN t.transaction_type = 'credit' THEN t.amount 
        ELSE '' 
    END AS "credit",
    CASE 
        WHEN t.transaction_type = 'debit' THEN t.amount 
        ELSE '' 
    END AS "debit"
    FROM (
    SELECT 
        ts.staff_id, 
        ts.apply_date AS "date",
        'credit' AS "transaction_type", 
        ts.amount AS "amount"
    FROM 
        staff_advances AS ts
    UNION ALL
    SELECT 
        ts.staff_id, 
        ad_pay.paid_date AS "date",
        'debit' AS "transaction_type", 
        ad_pay.paid_amount AS "amount"
    FROM 
        advance_payment_histories AS ad_pay
    INNER JOIN 
        staff_advances AS ts 
    ON 
        ad_pay.staff_advance_id = ts.staff_advance_id
    ) AS t
    LEFT JOIN 
    staffs AS s 
    ON 
    s.staff_id = t.staff_id 
    LEFT JOIN 
    department AS dep
    ON 
    dep.department_id = s.department_id 
    LEFT JOIN 
    designation AS des
    ON 
    des.designation_id = s.designation_id 
    LEFT JOIN 
    branches AS b
    ON 
    b.branch_id = s.branch_id 
      ${iql}
    ORDER BY 
    t.date ASC;`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffAdvance(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.staff_id || false && excuteMethod?.apply_date || false) {
      const existingStaffAdvance = await sequelize.models.staff_advance.findOne({
        where: {
          staff_id: excuteMethod.staff_id, apply_date: excuteMethod.apply_date
        }
      });
      if (existingStaffAdvance) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const staffAdvanceResult = await sequelize.models.staff_advance.create(excuteMethod);
    const req = {
      staffAdvanceId: staffAdvanceResult.staff_advance_id
    }
    return await getStaffAdvance(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffAdvance(staffAdvanceId, putData) {
  try {

    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.staff_id || false && excuteMethod?.apply_date || false) {
      const duplicateStaffAdvance = await sequelize.models.staff_advance.findOne({
        where: sequelize.literal(`staff_id = '${excuteMethod.staff_id}' AND apply_date = '${excuteMethod.apply_date}' AND staff_advance_id != '${staffAdvanceId}'`)
      });
      if (duplicateStaffAdvance) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const staffAdvanceResult = await sequelize.models.staff_advance.update(excuteMethod, { where: { staff_advance_id: staffAdvanceId } });
    const req = {
      staffAdvanceId: staffAdvanceId
    }
    return await getStaffAdvance(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffAdvance,
  updateStaffAdvance,
  createStaffAdvance,
  getStaffAdvanceLedger
};