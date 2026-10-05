"use strict";

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");

async function getStaffWorkExperience(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.workExperienceId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` de.work_experience_id = ${query.workExperienceId}`;
      }
    }
    const result = await sequelize.query(
      `SELECT work_experience_id "workExperienceId", staff_id "staffId",
        organization_name "organizationName", position, years_of_experience "yearsOfExperience", from_date "fromDate",
        to_date "toDate", gross_pay "grossPay", work_location "workLocation",
        reason_for_leaving "reasonForLeaving", createdAt
        FROM work_experiences ${iql}`,
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

async function createStaffWorkExperience(postData) {
  try {
    const excuteMethod = _.map(postData, (item) =>
      _.mapKeys(item, (value, key) => _.snakeCase(key))
    );
    const staffWorkExperienceResult =
      await sequelize.models.work_experience.bulkCreate(excuteMethod);
    return true;
  } catch (error) {
    throw new Error(
     error.message ? error.message : messages.OPERATION_ERROR
    );
  }
}

async function updateStaffWorkExperience(staffWorkExperienceId, putData) {
  try {
    if (putData.length > 0) {
      putData.map((item, index) => {
        const selectedId = item.workExperienceId;
        item.staffId = staffWorkExperienceId;
        const excuteMethod = _.mapKeys(item, (value, key) => _.snakeCase(key));
        if (selectedId > 0) {
          const staffWorkExperienceResult =
            sequelize.models.work_experience.update(excuteMethod, {
              where: { work_experience_id: selectedId },
            });
        } else {
          const staffWorkExperienceResult =
            sequelize.models.work_experience.create(excuteMethod);
        }
      });
      return true;
    } else {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
      const staffWorkExperienceResult =
        await sequelize.models.work_experience.update(excuteMethod, {
          where: { work_experience_id: staffWorkExperienceId },
        });
      const req = {
        workExperienceId: staffWorkExperienceId,
      };
      return await getStaffWorkExperience(req);
    }
  } catch (error) {
    throw new Error(
      error.message ? error.message : messages.OPERATION_ERROR
    );
  }
}

async function deleteStaffWorkExperience(staffWorkExperienceId) {
  try {
    const staffWorkExperienceResult =
      await sequelize.models.work_experience.destroy({
        where: { work_experience_id: staffWorkExperienceId },
      });
    if (staffWorkExperienceResult == 1) {
      return "Deleted Successfully...!";
    } else {
      return "Data Not Founded...!";
    }
  } catch (error) {
    throw new Error(
      error.message
        ? error.message
        : messages.OPERATION_ERROR
    );
  }
}

module.exports = {
  getStaffWorkExperience,
  updateStaffWorkExperience,
  deleteStaffWorkExperience,
  createStaffWorkExperience,
};
