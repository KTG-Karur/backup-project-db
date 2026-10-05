"use strict";

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");
const { generateSerialNumber } = require("../utils/utility");

// Role ids confirmed against the live `role` table (role_name): 1=Super Admin, 3=Admin Manager, 8=Operation Head
const SUPER_ADMIN_ROLE_ID = 1;
const ADMIN_MANAGER_ROLE_ID = 3;
const OPERATION_HEAD_ROLE_ID = 8;

// staffs.branch_id and the request tables' branch_id columns are all comma-separated varchars,
// so matching requires an id-by-id FIND_IN_SET overlap check, not a single equality/FIND_IN_SET call.
function buildBranchOverlapClause(alias, staffBranchIds) {
  const clause = staffBranchIds
    .map(() => `FIND_IN_SET(?, ${alias}.branch_id) > 0`)
    .join(" OR ");
  return { clause: `(${clause})`, params: staffBranchIds };
}

async function getNotification(staffId) {
  //   {
  //     "id": 14,
  //     "type": "permission",
  //     "text": "New Permission Request from Mr.PRAVEEN S",
  //     "subText": "For: testing",
  //     "route": "/view/permission",
  //     "date": "2025-04-18T05:48:21.000Z"
  // },
  try {
    const [requester] = await sequelize.query(
      `SELECT role_id roleId, branch_id branchId FROM staffs WHERE staff_id = ? AND is_active = 1 LIMIT 1`,
      { replacements: [staffId], type: QueryTypes.SELECT }
    );

    if (!requester) return [];

    const roleId = requester.roleId;
    const isSuperAdmin = roleId === SUPER_ADMIN_ROLE_ID;
    const isScopedRole = roleId === ADMIN_MANAGER_ROLE_ID || roleId === OPERATION_HEAD_ROLE_ID;

    if (!isSuperAdmin && !isScopedRole) return [];

    let staffBranchIds = [];
    if (isScopedRole) {
      staffBranchIds = (requester.branchId || "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");
      if (staffBranchIds.length === 0) return [];
    }

    // Staff Leave, Permission, and Claim requests are surfaced in notifications (Petrol Allowance
    // is intentionally excluded per requirement) for Super Admin/Admin Manager/Operation Head.
    const permissionBranch = isScopedRole ? buildBranchOverlapClause("per", staffBranchIds) : null;
    const leaveBranch = isScopedRole ? buildBranchOverlapClause("stl", staffBranchIds) : null;
    const claimBranch = isScopedRole ? buildBranchOverlapClause("cl", staffBranchIds) : null;

    const [permissions, leaves, claims] = await Promise.all([
      sequelize.query(
        `
      SELECT
        CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName, per.permission_id permission_id, per.reason reason, per.createdAt createdAt
      FROM permissions per
      left join staffs s on s.staff_id = per.staff_id
      left join status_lists sur on sur.status_list_id = s.surname_id
      WHERE per.status_id = 28 ${permissionBranch ? `AND ${permissionBranch.clause}` : ""}
    `,
        { replacements: permissionBranch ? permissionBranch.params : [], type: QueryTypes.SELECT }
      ),

      sequelize.query(
        `
      SELECT
       CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName, stl.staff_leave_id staff_leave_id,  stl.reason reason, stl.createdAt createdAt
      FROM staff_leaves stl
      left join staffs s on s.staff_id = stl.staff_id
      left join status_lists sur on sur.status_list_id =   s.surname_id
      WHERE stl.status_id = 28 ${leaveBranch ? `AND ${leaveBranch.clause}` : ""}
    `,
        { replacements: leaveBranch ? leaveBranch.params : [], type: QueryTypes.SELECT }
      ),

      sequelize.query(
        `
      SELECT
       CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName, cl.claim_id claim_id, ct.claim_type_name claimTypeName, cl.createdAt
      FROM claims cl
      left join staffs s on s.staff_id = cl.requested_by
      left join status_lists sur on sur.status_list_id = s.surname_id
      left join claim_types ct on ct.claim_type_id = cl.claim_type_id
      WHERE cl.status_id = 28 ${claimBranch ? `AND ${claimBranch.clause}` : ""}
    `,
        { replacements: claimBranch ? claimBranch.params : [], type: QueryTypes.SELECT }
      ),
    ]);

    const formatted = [
      ...permissions.map((item) => ({
        id: item.permission_id,
        type: "permission",
        text: `${item.staffName} - Permission Request`,
        subText: `For: ${item.reason}`,
        route: "/view/permission",
        date: item.createdAt,
      })),
      ...leaves.map((item) => ({
        id: item.staff_leave_id,
        type: "leave",
        text: `${item.staffName} - Staff Leave Request`,
        subText: `For: ${item.reason}`,
        route: "/staff/staff-leave",
        date: item.createdAt,
      })),
      // ...petrols.map((item) => ({
      //   id: item.petrol_allowance_id,
      //   type: "petrol",
      //   text: `${item.staffName} - Petrol Request`,
      //   subText: `For: ${item.bill_no}`,
      //   route: "/allowance/petrol-allowance",
      //   date: item.createdAt,
      // })),
      ...claims.map((item) => ({
        id: item.claim_id,
        type: "claim",
        text: `${item.staffName} - Claim Request`,
        subText: `For: ${item.claimTypeName || 'N/A'}`,
        route: "/claim/claim-list",
        date: item.createdAt,
      })),
    ];

    return formatted;
  } catch (error) {
    throw new Error(error.message || messages.OPERATION_ERROR);
  }
}

module.exports = {
  getNotification,
};
