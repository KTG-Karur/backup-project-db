"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getProofType(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.proofTypeId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` proof_type_id = ${query.proofTypeId}`;
      }
      if (query.isActive) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` is_active = ${query.isActive}`;
      }
    }
    const result = await sequelize.query(`SELECT proof_type_id "proofTypeId", proof_type_name "proofTypeName",
        createdAt, is_active "isActive"
        FROM proof_types ${iql}`, {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createProofType(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const proofTypeResult = await sequelize.models.proof_type.create(excuteMethod);
    const req = {
      proofTypeId: proofTypeResult.proof_type_id
    }
    return await getProofType(req);
  } catch (error) {
    
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateProofType(proofTypeId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const proofTypeResult = await sequelize.models.proof_type.update(excuteMethod, { where: { proof_type_id: proofTypeId } });
    const req = {
      proofTypeId: proofTypeId
    }
    return await getProofType(req);
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

module.exports = {
  getProofType,
  updateProofType,
  createProofType
};