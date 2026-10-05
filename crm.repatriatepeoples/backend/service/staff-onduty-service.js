"use strict";

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");

async function getStaffOnDuty(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffOnDutyId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sl.staff_onduty_id = ${query.staffOnDutyId}`;
      }
      if (query.statusId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sl.status_id = ${query.statusId}`;
      }
      // if (query.branchId) {
      //   iql += count >= 1 ? ` AND` : ``;
      //   count++;
      //   iql += ` sl.branch_id = ${query.branchId}`;
      // }
      if (query.branchId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        if (query.branchId.includes(',')) {
            const branchIds = query.branchId.split(',')
                .map(id => id.trim())
                .filter(id => id !== ''); 
            
            if (branchIds.length > 0) {
                const orConditions = branchIds.map(id => `sl.branch_id = ${id}`).join(' OR ');
                iql += ` (${orConditions})`;
            }
        } else {
            iql += ` sl.branch_id = ${query.branchId}`;
        }
    }
      if (query.attendanceDate) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sl.from_date <= '${query.attendanceDate}' AND '${query.attendanceDate}' <= sl.to_date`;
      }
    }
    const result = await sequelize.query(
      `SELECT sl.staff_onduty_id "staffOnDutyId", sl.staff_id "staffId",CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName,
        sl.day_count "dayCount", sl.reason, sl.from_date "fromDate",
        s.staff_profile_image_name AS "staffProfile",
        s.staff_code "staffCode",
        sl.branch_id "branchId",
          sl.spoken_date "spokenDate",
      sl.spoken_time "spokenTime",
      sl.spoken_staff_id "spokenStaffId",
      CONCAT(sur_sp.status_name,'.',sp.first_name,' ',sp.last_name) as "spokenStaffName",
        sl.to_date "toDate", sl.approved_by "approvedBy", sl.status_id "statusId",
        sl2.status_name "statusName", sl.createdAt, sl.updatedAt,
        
      des.designation_name 'designationName',  dep.department_name 'departmentName',
      des_sp.designation_name 'spokenDesignationName',  dep_sp.department_name 'spokenDepartmentName'

        FROM staff_onduties sl
        left join staffs s on s.staff_id = sl.staff_id 
      left join staffs sp on sp.staff_id = sl.spoken_staff_id
        left join status_lists sl2 on sl2.status_list_id = sl.status_id 

      left join designation des on des.designation_id = s.designation_id
      left join department dep on dep.department_id = s.department_id
      
      left join designation des_sp on des_sp.designation_id = sp.designation_id
      left join department dep_sp on dep_sp.department_id = sp.department_id

      left join status_lists sur on sur.status_list_id = s.surname_id 
      left join status_lists sur_sp on sur_sp.status_list_id = sp.surname_id ${iql}
      ORDER BY sl.staff_onduty_id DESC`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );
    return result;
  } catch (error) {
    throw new Error(
      error.message ? error.message : messages.OPERATION_ERROR
    );
  }
}

async function createStaffOnDuty(postData) {
  try {
    const checkPerviousApplyOnDuty = await sequelize.query(
      `SELECT sl.staff_onduty_id "staffOnDutyId"
      FROM staff_onduties sl
      WHERE (
         '${postData.fromDate}' <= sl.to_date 
          AND '${postData.toDate}' >= sl.from_date AND sl.staff_id = ${postData.staffId} AND sl.status_id != 30
      )`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );

    if (checkPerviousApplyOnDuty.length <= 0) {
      const excuteMethod = _.mapKeys(postData, (value, key) =>
        _.snakeCase(key)
      );
      const staffOnDutyResult = await sequelize.models.staff_onduties.create(
        excuteMethod
      );
      const req = {
        staffOnDutyId: staffOnDutyResult.staff_onduty_id,
      };
      return await getStaffOnDuty(req);
    } else {
      throw new Error(messages.ONDUTY_APPLIED_BEFORE);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffOnDuty(staffOnDutyId, putData) {
  try {
    // check is cancelled or not
    if (putData.statusId == 28) {
      const checkPerviousApplyOnDuty = await sequelize.query(
        `SELECT sl.staff_onduty_id "staffOnDutyId"
          FROM staff_onduties sl
          WHERE (
             '${putData.fromDate}' <= sl.to_date 
              AND '${putData.toDate}' >= sl.from_date AND sl.staff_id = ${putData.staffId} AND sl.status_id != 30 AND sl.staff_onduty_id <> ${staffOnDutyId}
          )`,
        {
          type: QueryTypes.SELECT,
          raw: true,
          nest: false,
        }
      );


      if (checkPerviousApplyOnDuty.length <= 0) {
        const excuteMethod = _.mapKeys(putData, (value, key) =>
          _.snakeCase(key)
        );

        const staffOnDutyResult = await sequelize.models.staff_onduties.update(
          excuteMethod,
          { where: { staff_onduty_id: staffOnDutyId } }
        );
        const req = {
          staffOnDutyId: staffOnDutyId,
        };
        return await getStaffOnDuty(req);
      } else {
        throw new Error(messages.ONDUTY_APPLIED_BEFORE);
      }
    } else {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
      const staffOnDutyResult = await sequelize.models.staff_onduties.update(
        excuteMethod,
        { where: { staff_onduty_id: staffOnDutyId } }
      );
      const req = {
        staffOnDutyId: staffOnDutyId,
      };
      return await getStaffOnDuty(req);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffOnDuty,
  updateStaffOnDuty,
  createStaffOnDuty,
};
