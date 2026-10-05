"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
// const { createSalaryIncreamentHistory } = require('./salary-increament-history-service');

async function getStaffSalaryAllocate(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffSalaryAllocateId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sa.staff_salary_allocated_id = ${query.staffSalaryAllocateId}`;
      }
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sa.staff_id = ${query.staffId}`;
    }
    }
    const result = await sequelize.query(`SELECT sa.staff_salary_allocated_id "staffSalaryAllocatedId", CONCAT(s.first_name, ' ', s.last_name) AS staffName,
        s.staff_id "staffId", sa.annual_amount "annualAmount", sa.monthly_amount "monthlyAmount",s.staff_code "staffCode",s.contact_no "contactNo",
        sa.esi_amount "esiAmount", sa.pf_amount "pfAmount", sa.createdAt
        FROM staff_salary_allocateds sa
        left join staffs s on s.staff_id = sa.staff_id  ${iql}`, {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaffSalaryAllocate(postData) {
  try {
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const staffSalaryAllocateResult = await sequelize.models.staff_salary_allocated.create(excuteMethod);
    const salaryIncrementReq = {
      staffId : postData.staffId, 
      salaryAmount : postData.monthlyAmount, 
      esiAmount : postData.esiAmount, 
      annualAmount : postData.annualAmount, 
      pfAmount : postData.pfAmount, 
    }
    // const salaryIncrement = await createSalaryIncreamentHistory(salaryIncrementReq)
    const req = {
      staffSalaryAllocateId: staffSalaryAllocateResult.staff_salary_allocated_id
    }
    return await getStaffSalaryAllocate(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffSalaryAllocate(staffSalaryAllocateId, putData) {
  try {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
      const staffSalaryAllocateResult = await sequelize.models.staff_salary_allocated.update(excuteMethod, { where: { staff_salary_allocated_id: staffSalaryAllocateId } });
      const salaryIncrementReq = {
        staffId : putData.staffId, 
        salaryAmount : putData.monthlyAmount, 
        esiAmount : putData.esiAmount, 
        annualAmount : putData.annualAmount, 
        increamentBy : putData?.increamentBy || "", 
        increamentDate : putData?.increamentDate || "", 
        pfAmount : putData.pfAmount, 
      }
      // const salaryIncrement = await createSalaryIncreamentHistory(salaryIncrementReq)
      const req = {
        staffSalaryAllocateId: staffSalaryAllocateId
      }
      return await getStaffSalaryAllocate(req);
    
    
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

module.exports = {
  getStaffSalaryAllocate,
  updateStaffSalaryAllocate,
  createStaffSalaryAllocate
};