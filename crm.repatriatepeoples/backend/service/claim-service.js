"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const moment = require('moment');
const { ACCESS_IDS, hasPageAccess } = require("./access-service");

async function getClaim(query, isEdit = false) {
  try {
    let filters = [];

    if (query && Object.keys(query).length) {
      if (query.claimId) {
        filters.push(`c.claim_id = ${query.claimId}`);
      }

      if (query.statusId) {
        filters.push(`c.status_id = ${query.statusId}`);
      }

      if (query.approvedBy) {
        filters.push(`c.approved_by = ${query.approvedBy}`);
      }

      if (query.fromDate) {
        const from = moment(query.fromDate).format('YYYY-MM-DD');
        const to = moment(query.toDate).format('YYYY-MM-DD');
        filters.push(`c.apply_date BETWEEN '${from} 00:00:00' AND '${to} 23:59:59'`);
      }

      if (query.requestedBy) {
        filters.push(`c.requested_by = ${query.requestedBy}`);
      }

      if (query.requestedDate) {
        filters.push(`DATE(c.apply_date) = '${query.requestedDate}'`);
      }

      if (query.approvedDate) {
        filters.push(`DATE(c.approved_date) = '${query.approvedDate}'`);
      }

      if (query.approvedDate) {
        filters.push(`DATE(c.purchase_date) = '${query.approvedDate}'`);
      }

      if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
        if (String(query.branchId).includes(',')) {
          const branchIds = String(query.branchId)
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '' && id !== '0');
          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
            filters.push(`(${orConditions})`);
          }
        } else {
          filters.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
        }
      }

      if (query.departmentId || query.departmentId === '') {
        if (query.departmentId !== '') {
          filters.push(`s.department_id = ${query.departmentId}`);
        }
      }

      if (query.type === 'travel') {
        filters.push(`(ct.claim_type_name = 'TRAVEL EXPENSES' OR ct.claim_type_name = 'TRAVEL-EXPENSES')`);
      } else if (query.type === 'other') {
        filters.push(`(ct.claim_type_name IS NULL OR (ct.claim_type_name != 'TRAVEL EXPENSES' AND ct.claim_type_name != 'TRAVEL-EXPENSES'))`);
      }

      if (query.excludeClaimTypeId) {
        const excludeIds = String(query.excludeClaimTypeId).split(',').map(id => id.trim()).filter(id => id);
        if (excludeIds.length === 1) {
          filters.push(`c.claim_type_id != ${excludeIds[0]}`);
        } else if (excludeIds.length > 1) {
          filters.push(`c.claim_type_id NOT IN (${excludeIds.join(',')})`);
        }
      }
    }
    if (!isEdit) {
      filters.push(`c.is_active = 1`);
    }

    const iql = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await sequelize.query(`SELECT c.claim_id "claimId", c.claim_type_id "claimTypeId",ct.claim_type_name "claimTypeName",
        s.staff_profile_image_name AS "staffProfile",
        c.requested_by "requestedById",CONCAT(s.first_name,' ',s.last_name) as requestedBy,
        c.bank_account_id "bankAccountId",s.dob "dob",s.date_of_joining "dateOfJoining",
        c.requested_amount "requestedAmount", c.reason, c.branch_id "branchId",b.branch_name "branchName",s.staff_code "staffCode",
        c.recepit_image_name "recepitImageName",sl.status_name "statusName", c.claim_amount "claimAmount",
        c.apply_date "applyDate",c.purchase_date "purchaseDate", c.status_id "statusId", c.mode_of_payment_id "modeOfPaymentId",
        sl2.status_name "paymentModeName", c.approved_date "approvedDate",c.approved_by "approvedById",
        CONCAT(s2.first_name,' ',s2.last_name) as approvedBy, c.createdAt,
        ct.eligible_amount "eligibleAmount",c.recepit_image_name "recepitImageName",
        s.role_id "roleId", rl.role_name "roleName", c.is_active "isActive",
        des.designation_name 'designationName',  dep.department_name 'departmentName',
        s.branch_id "staffBranchId", b_staff.branch_name "staffBranchName"
        FROM claims c
        left join claim_types ct on ct.claim_type_id = c.claim_type_id 
        left join staffs s on s.staff_id = c.requested_by 
        left join staffs s2 on s2.staff_id = c.approved_by 
        left join branches b on b.branch_id = c.branch_id 
        left join branches b_staff on b_staff.branch_id = s.branch_id
        left join role rl on rl.role_id = s.role_id
      left join designation des on des.designation_id = s.designation_id
      left join department dep on dep.department_id = s.department_id
        left join status_lists sl on sl.status_list_id = c.status_id 
        left join status_lists sl2 on sl2.status_list_id = c.mode_of_payment_id 
        ${iql}
      ORDER BY c.claim_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createClaim(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    console.log(excuteMethod)
    const claimResult = await sequelize.models.claim.create(excuteMethod);
    const req = {
      claimId: claimResult.claim_id
    }
    return await getClaim(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateClaim(claimId, putData, user) {
  try {
    if (putData.statusId === 29 || putData.statusId === 30) {
      const requiredAccessId = putData.statusId === 29 ? ACCESS_IDS.APPROVED : ACCESS_IDS.REJECTED;
      const allowed = await hasPageAccess(user.staffId, "/claim/claim-list", requiredAccessId);
      if (!allowed) {
        throw new Error("Not authorized to " + (putData.statusId === 29 ? "approve" : "reject") + " claim requests");
      }
    }
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const claimResult = await sequelize.models.claim.update(excuteMethod, { where: { claim_id: claimId } });
    const req = {
      claimId: claimId
    }
    return await getClaim(req, true);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getClaim,
  updateClaim,
  createClaim
};