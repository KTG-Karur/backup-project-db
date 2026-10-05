"use strict";

const sequelize = require("../models/index").sequelize;
const { QueryTypes } = require("sequelize");

const SUPER_ADMIN_ROLE_ID = 1;

const ACCESS_IDS = {
  CREATE: 1,
  UPDATE: 2,
  DELETE: 3,
  VIEW: 4,
  PRINT: 5,
  APPROVED: 6,
  REJECTED: 7,
  ADMIN_ACCESS: 8,
};

// Returns { roleId, branchId } for an active staff, or null.
async function getStaffRoleAndBranch(staffId) {
  const [staff] = await sequelize.query(
    `SELECT role_id AS roleId, branch_id AS branchId FROM staffs WHERE staff_id = ? AND is_active = 1 LIMIT 1`,
    { replacements: [staffId], type: QueryTypes.SELECT }
  );
  return staff || null;
}

// Checks whether staffId's role has been granted accessId on the page identified by pageUrl,
// via role_permission.access_ids (JSON: {"access":[{"pageId":N,"accessPermission":[...]}]}).
// Super Admin always passes. Any missing lookup (staff/page/role_permission/malformed JSON) denies.
async function hasPageAccess(staffId, pageUrl, accessId) {
  const staff = await getStaffRoleAndBranch(staffId);
  if (!staff) return false;
  if (staff.roleId === SUPER_ADMIN_ROLE_ID) return true;

  const [page] = await sequelize.query(
    `SELECT page_id AS pageId FROM pages WHERE page_url = ? AND is_active = 1 LIMIT 1`,
    { replacements: [pageUrl], type: QueryTypes.SELECT }
  );
  if (!page) return false;

  const [rolePermission] = await sequelize.query(
    `SELECT access_ids AS accessIds FROM role_permission WHERE role_id = ? LIMIT 1`,
    { replacements: [staff.roleId], type: QueryTypes.SELECT }
  );
  if (!rolePermission) return false;

  let parsed;
  try {
    parsed = JSON.parse(rolePermission.accessIds);
  } catch (error) {
    return false;
  }

  const pageEntry = (parsed.access || []).find((entry) => entry.pageId === page.pageId);
  return !!pageEntry && Array.isArray(pageEntry.accessPermission) && pageEntry.accessPermission.includes(accessId);
}

module.exports = {
  ACCESS_IDS,
  hasPageAccess,
  getStaffRoleAndBranch,
};
