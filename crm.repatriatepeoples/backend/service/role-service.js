"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { createRolePermission, updateRolePermission } = require('./role-permission-service');
const { QueryTypes } = require('sequelize');

async function getRole(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.roleId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` role_id = ${query.roleId}`;
      }
      if (query.isActive) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` is_active = ${query.isActive}`;
      }
    }

    // if (iql == "") {
    //   iql += "WHERE role_id != 1"
    // } else {
    //   iql += " AND role_id != 1"
    // }
    const result = await sequelize.query(`SELECT role_id "roleId",role_name "roleName",is_active "isActive", createdAt FROM role ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createRole(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const roleResult = await sequelize.models.role.create(excuteMethod);
    const req = {
      roleId: roleResult.role_id,
      accessIds: postData.accessIds
    }
    const rolePermission = createRolePermission(req)
    return await getRole(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateRole(roleId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    if (putData.isActive === 0) {
      const roleResult = await sequelize.models.role.update(excuteMethod, { where: { role_id: roleId } });
      const req = {
        roleId: roleId,
      }
      return await getRole(req);
    } else {
      const roleResult = await sequelize.models.role.update(excuteMethod, { where: { role_id: roleId } });
      const req = {
        roleId: roleId,
        accessIds: putData.accessIds,
        rolePermissionId: putData.rolePermissionId
      }
      const rolePermission = updateRolePermission(req.rolePermissionId, req)
      return await getRole(req);
    }

  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteRole(roleId) {
  try {
    const roleResult = await sequelize.models.role.destroy({ where: { role_id: roleId } });
    if (roleResult == 1) {
      return "Deleted Successfully...!";
    } else {
      return "Data Not Founded...!";
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getRole,
  updateRole,
  createRole,
  deleteRole
};