"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');

async function getSalaryIncreamentHistory(query) {
    try {
        let iql = "";
        let count = 0;
        if (query && Object.keys(query).length) {
            iql += `WHERE`;
            if (query.salaryIncreamentHistoryId) {
                iql += count >= 1 ? ` AND` : ``;
                count++;
                iql += ` salary_increament_history_id = ${query.salaryIncreamentHistoryId}`;
            }
        }
        const result = await sequelize.query(`SELECT salary_increament_history_id "salaryIncreamentHistoryId", staff_id "staffId",
        salary_amount "salaryAmount", esi_amount "esiAmount", pf_amount "pfAmount", increament_date "increamentDate",
        increament_by "increamentBy", createdAt, updatedAt
        FROM salary_increament_histories ${iql}`, {
            type: QueryTypes.SELECT,
            raw: true,
            nest: false
        });
        return result;
    } catch (error) {

        throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
    }
}

// async function getSalaryInfoDetails(query) {
//     try {
//         let iql = "";
//         let count = 0;
//         if (query && Object.keys(query).length) {
//             iql += `WHERE`;
//             if (query.staffId) {
//                 iql += count >= 1 ? ` AND` : ``;
//                 count++;
//                 iql += ` sa.staff_id = ${query.staffId}`;
//             }
//         }
//         const result = await sequelize.query(`SELECT sa.staff_salary_allocated_id "staffSalaryAllocatedId", sa.staff_id "staffId", CONCAT(s.first_name, ' ', s.last_name) AS staffName,
//             sa.annual_amount "annualAmount", sa.monthly_amount "monthlyAmount", sa.esi_amount "esiAmount",
//             sa.pf_amount "pfAmount"
//             FROM staff_salary_allocateds sa
//             left join staffs s on s.staff_id = sa.staff_id  ${iql}`, {
//             type: QueryTypes.SELECT,
//             raw: true,
//             nest: false
//         });
//         return result;
//     } catch (error) {

//         throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
//     }
// }

async function createSalaryIncreamentHistory(postData) {
    try {
        const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
        const salaryIncreamentHistoryResult = await sequelize.models.salary_increament_history.create(excuteMethod);
        return true;
    } catch (error) {
        throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
    }
}

async function updateSalaryIncreamentHistory(salaryIncreamentHistoryId, putData) {
    try {
        const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
        const salaryIncreamentHistoryResult = await sequelize.models.salaryIncreamentHistory.update(excuteMethod, { where: { salary_increament_history_id: salaryIncreamentHistoryId } });
        const req = {
            salaryIncreamentHistoryId: salaryIncreamentHistoryId
        }
        return await getSalaryIncreamentHistory(req);
    } catch (error) {
        throw new Error(error?.message ? error.message : messages.OPERATION_ERROR);
    }
}

module.exports = {
    getSalaryIncreamentHistory,
    updateSalaryIncreamentHistory,
    createSalaryIncreamentHistory,
    // getSalaryInfoDetails
};