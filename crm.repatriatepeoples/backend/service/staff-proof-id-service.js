"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getStaffProof(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffProofId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.staff_proof_id = ${query.staffProofId}`;
      }
    }
    const result = await sequelize.query(`SELECT sp.staff_proof_id "staffProofId", sp.staff_id "staffId", sp.proof_type_id "proofTypeId",
        pt.proof_type_name "proofTypeName",
        sp.proof_number "proofNumber", sp.proof_image_name "proofImageName", sp.createdAt
        FROM staff_proofs sp
        left join proof_types pt on pt.proof_type_id = sp.proof_type_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffProof(postData) {
  try {
    const excuteMethod = _.map(postData, (item) => _.mapKeys(item, (value, key) => _.snakeCase(key)));
    const staffProofResult = await sequelize.models.staff_proof.bulkCreate(excuteMethod);
    return true
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffProof(staffProofId, putData) {
  try {
    if (putData.length > 0) {
      putData.map((item, index) => {
        const selectedId = item?.staffProofId || 0
        item.staffId = staffProofId
        const excuteMethod = _.mapKeys(item, (value, key) => _.snakeCase(key))
        if(selectedId > 0) {
          const staffProofResult = sequelize.models.staff_proof.update(excuteMethod, { where: { staff_proof_id: selectedId } });
        }else{
          const staffProofResult = sequelize.models.staff_proof.create(excuteMethod);
        }
      })
      return true;
    } else {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
      const staffProofResult = await sequelize.models.staff_proof.update(excuteMethod, { where: { staff_proof_id: staffProofId } });
      const req = {
        staffProofId: staffProofId
      }
      return await getStaffProof(req);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaffProof(staffProofId) {
  try {
    const staffProofResult = await sequelize.models.staff_proof.destroy({ where: { staff_proof_id: staffProofId } });
    if(staffProofResult == 1){
      return "Deleted Successfully...!";
    }else{
      return "Data Not Founded...!";
    }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

module.exports = {
  getStaffProof,
  updateStaffProof,
  createStaffProof,
  deleteStaffProof
};