"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const { QueryTypes } = require('sequelize');
const _ = require('lodash');

async function getPermission(query) {
  try {
    const whereClauses = [];
    const replacements = {};

    if (query && Object.keys(query).length) {
      if (query.permissionId) {
        whereClauses.push(`ts.permission_id = :permissionId`);
        replacements.permissionId = query.permissionId;
      }
      if (query.statusId) {
        whereClauses.push(`ts.status_id = :statusId`);
        replacements.statusId = query.statusId;
      }
      if (query.staffId) {
        whereClauses.push(`s.staff_id = :staffId`);
        replacements.staffId = query.staffId;
      }
      if (query.branchId) {
        if (query.branchId.includes(',')) {
          const branchIds = query.branchId.split(',')
            .map(id => id.trim())
            .filter(id => id !== '');

          if (branchIds.length > 0) {
            whereClauses.push(`s.branch_id IN (:branchIds)`);
            replacements.branchIds = branchIds;
          }
        } else {
          whereClauses.push(`s.branch_id = :branchId`);
          replacements.branchId = query.branchId;
        }
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        ts.permission_id "permissionId",
        ts.permission_type_id "permissionTypeId",
        ts.staff_id "staffId",
        CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as "staffName",
        ts.branch_id "branchId",
        s.branch_id "staffBranchId",
        ts.spoken_date "spokenDate",
        ts.spoken_time "spokenTime",
        ts.spoken_staff_id "spokenStaffId",
        CONCAT(sur_sp.status_name,'.',sp.first_name,' ',sp.last_name) as "spokenStaffName",
        ts.permission_date "permissionDate", 
        ts.reason "reason", 
        sl.status_name "permissionTypeName",
        ts.createdAt,
        ts.status_id "statusId",
        des.designation_name "designationName",  
        dep.department_name "departmentName",
        des_sp.designation_name "spokenDesignationName",  
        dep_sp.department_name "spokenDepartmentName",
        COUNT(*) OVER (PARTITION BY ts.staff_id, EXTRACT(MONTH FROM ts.permission_date), EXTRACT(YEAR FROM ts.permission_date)) as "monthlyPermissionCount"
      FROM permissions ts
      LEFT JOIN staffs s ON s.staff_id = ts.staff_id
      LEFT JOIN staffs sp ON sp.staff_id = ts.spoken_staff_id
      LEFT JOIN designation des ON des.designation_id = s.designation_id
      LEFT JOIN department dep ON dep.department_id = s.department_id
      LEFT JOIN designation des_sp ON des_sp.designation_id = sp.designation_id
      LEFT JOIN department dep_sp ON dep_sp.department_id = sp.department_id
      LEFT JOIN status_lists sur ON sur.status_list_id = s.surname_id 
      LEFT JOIN status_lists sur_sp ON sur_sp.status_list_id = sp.surname_id 
      LEFT JOIN status_lists sl ON sl.status_list_id = ts.permission_type_id
      ${whereClause}
      ORDER BY permission_id DESC
    `;

    const result = await sequelize.query(sqlQuery, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}
//  async function getPermission(query) {
//   try {
//     const whereClauses = [];
//     const replacements = {};

//     if (query && Object.keys(query).length) {
//       if (query.permissionId) {
//         whereClauses.push(`ts.permission_id = :permissionId`);
//         replacements.permissionId = query.permissionId;
//       }
//       if (query.statusId) {
//         whereClauses.push(`ts.status_id = :statusId`);
//         replacements.statusId = query.statusId;
//       }
//       if (query.staffId) {
//         whereClauses.push(`s.staff_id = :staffId`);
//         replacements.staffId = query.staffId;
//       }
//       if (query.branchId) {
//         if (query.branchId.includes(',')) {
//           const branchIds = query.branchId.split(',')
//             .map(id => id.trim())
//             .filter(id => id !== '');

//           if (branchIds.length > 0) {
//             whereClauses.push(`s.branch_id IN (:branchIds)`);
//             replacements.branchIds = branchIds;
//           }
//         } else {
//           whereClauses.push(`s.branch_id = :branchId`);
//           replacements.branchId = query.branchId;
//         }
//       }
//     }

//     const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

//     const sqlQuery = `
//       SELECT 
//         ts.permission_id "permissionId",
//         ts.permission_type_id "permissionTypeId",
//         ts.staff_id "staffId",
//         CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as "staffName",
//         ts.branch_id "branchId",
//         s.branch_id "staffBranchId",
//         ts.spoken_date "spokenDate",
//         ts.spoken_time "spokenTime",
//         ts.spoken_staff_id "spokenStaffId",
//         CONCAT(sur_sp.status_name,'.',sp.first_name,' ',sp.last_name) as "spokenStaffName",
//         ts.permission_date "permissionDate", 
//         ts.reason "reason", 
//         sl.status_name "permissionTypeName",
//         ts.createdAt,
//         ts.status_id "statusId",
//         des.designation_name "designationName",  
//         dep.department_name "departmentName",
//         des_sp.designation_name "spokenDesignationName",  
//         dep_sp.department_name "spokenDepartmentName",
//          COUNT(CASE WHEN ts.status_id = 29 THEN 1 END) OVER (
//       PARTITION BY ts.staff_id, 
//       EXTRACT(MONTH FROM ts.permission_date), 
//       EXTRACT(YEAR FROM ts.permission_date)
//     ) as "monthlyApprovedPermissionCount"
//         FROM permissions ts
//       LEFT JOIN staffs s ON s.staff_id = ts.staff_id
//       LEFT JOIN staffs sp ON sp.staff_id = ts.spoken_staff_id
//       LEFT JOIN designation des ON des.designation_id = s.designation_id
//       LEFT JOIN department dep ON dep.department_id = s.department_id
//       LEFT JOIN designation des_sp ON des_sp.designation_id = sp.designation_id
//       LEFT JOIN department dep_sp ON dep_sp.department_id = sp.department_id
//       LEFT JOIN status_lists sur ON sur.status_list_id = s.surname_id 
//       LEFT JOIN status_lists sur_sp ON sur_sp.status_list_id = sp.surname_id 
//       LEFT JOIN status_lists sl ON sl.status_list_id = ts.permission_type_id
//       ${whereClause}
//     `;

//     const result = await sequelize.query(sqlQuery, {
//       replacements,
//       type: QueryTypes.SELECT,
//       raw: true,
//       nest: false
//     });

//     return result;
//   } catch (error) {
//     throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
//   }
// }


async function createPermission(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    if (excuteMethod?.permission_date || false && excuteMethod?.staff_id || false) {
      const existingPermission = await sequelize.models.permission.findOne({
        where: {
          staff_id: excuteMethod.staff_id,
          permission_date: sequelize.where(
            sequelize.fn('DATE', sequelize.col('permission_date')),
            excuteMethod.permission_date
          )
        }
      });
      if (existingPermission) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const permissionResult = await sequelize.models.permission.create(excuteMethod);
    const req = {
      permissionId: permissionResult.permission_id
    }
    return await getPermission(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updatePermission(permissionId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))

    if (excuteMethod?.permission_date || false && excuteMethod?.staff_id || false) {
      const duplicatePermission = await sequelize.models.permission.findOne({
        where: sequelize.literal(`staff_id = '${excuteMethod.staff_id}' AND permission_date = '${excuteMethod.permission_date}' AND permission_id != ${permissionId}`)
      });
      if (duplicatePermission) {
        throw new Error(messages.DUPLICATE_ENTRY);
      }
    }

    const permissionResult = await sequelize.models.permission.update(excuteMethod, { where: { permission_id: permissionId } });
    const req = {
      permissionId: permissionId
    }
    return await getPermission(req);
  } catch (error) {
    throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getPermission,
  updatePermission,
  createPermission,
};