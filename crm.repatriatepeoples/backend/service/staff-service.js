"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { generateSerialNumber, encrptPassword, decrptPassword } = require('../utils/utility');
const { createBankAccount, updateBankAccount } = require('./bank-account-service');
const { createUser, deleteUser, updateUser } = require('./user-service');
const { createStaffWorkExperience, updateStaffWorkExperience } = require('./staff-work-experience-service');
const { createStaffKnownLanguage, updateStaffKnownLanguage } = require('./staff-known-language-service');
const { createStaffQualification, updateStaffQualification } = require('./staff-qualification-service');
const { createStaffRelation, updateStaffRelation } = require('./staff-relation-service');
const { createStaffProof, updateStaffProof } = require('./staff-proof-id-service');
const { createStaffSalaryAllocate, updateStaffSalaryAllocate } = require('./staff-salary-allocate-service');
const { createStaffAchievement, updateStaffAchievement } = require('./staff-achievement-service');

async function getStaff(query) {
  try {
    let filters = [];

    if (query && Object.keys(query).length) {
      if (query.staffId) {
        filters.push(`st.staff_id = ${query.staffId}`);
      }

      if (query.branchId || query.branchId === '') {
        if (query.branchId !== '') {
          if (query.branchId.includes(',')) {
            const branchIds = query.branchId
              .split(',')
              .map(id => id.trim())
              .filter(id => id !== '');

            if (branchIds.length > 0) {
              const branchConditions = branchIds
                .map(id => `st.branch_id = ${id}`)
                .join(' OR ');
              filters.push(`(${branchConditions} OR st.role_id IN (1,8))`);
            } else {
              filters.push(`st.role_id IN (1,8)`);
            }
          } else {
            filters.push(`(st.branch_id = ${query.branchId} OR st.role_id IN (1,8))`);
          }
        } else if (query.departmentId === '') {
          filters = []; // Clear all filters
        }
      }

      if (query.departmentId || query.departmentId === '') {
        if (query.departmentId !== '') {
          filters.push(`st.department_id = ${query.departmentId}`);
        } else if (query.branchId === '') {
          filters = [];
        }
      }

      if (query.roleId) {
        filters.push(`st.role_id <> ${query.roleId}`);
      }
    }

    filters.push(`st.is_active = 1`);

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await sequelize.query(`SELECT st.staff_id "staffId",CONCAT(sur.status_name,'.',st.first_name,' ',st.last_name) as staffName, st.staff_code "staffCode", st.contact_no "contactNo", st.branch_id "branchId", st.role_id "roleId",
      st.is_active "isActive",  
      
      st.staff_profile_image_name AS "staffProfile",
        st.department_id "departmentId",d.department_name "departmentName",r.role_name "roleName"
        FROM staffs st
        left join department d on d.department_id = st.department_id 
        left join status_lists sur on sur.status_list_id = st.surname_id
        left join role r on r.role_id = st.role_id  ${whereClause}
        ORDER BY st.staff_id DESC`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function getStaffDetails(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` st.staff_id = ${query.staffId}`;
      }
    }
    const personalInfoData = await sequelize.query(`
      SELECT st.staff_id "staffId",st.surname_id "surnameId", st.staff_code "staffCode",
      st.first_name "firstName", st.last_name "lastName", st.age "age", st.address "address", 
      st.vehicle_no "vehicleNo",
      st.caste_type_id "casteTypeId",cst.status_name "casteName", st.contact_no "contactNo", st.dob,
      st.alternative_contact_no "alternativeContactNo", st.email_id "emailId",
      st.staff_profile_image_name "staffProfileImageName",st.expected_salary "expectedSalary",
      st.time_to_join_id "timeToJoinId", timetojoin.status_name "timeToJoinName", st.preferred_location_id "preferredLocationId",
        GROUP_CONCAT(br.branch_name SEPARATOR ', ') AS "preferenceLocationList",
         CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
        'staffName', CONCAT(ref.first_name, ' ', ref.last_name),
        'contactNo', ref.contact_no,
        'emailId', ref.email_id
    ) 
    SEPARATOR ','
), ']') AS referenceList,
      st.references_by "referencesBy",
      st.other_information "otherInformation",
      st.gender_id "genderId", st.martial_status_id "martialStatusId"
      FROM staffs st
      left join status_lists sur on sur.status_list_id = st.surname_id
      left join status_lists cst on cst.status_list_id = st.caste_type_id
      left join status_lists g on g.status_list_id = st.gender_id
      left join branches br on FIND_IN_SET(br.branch_id, st.preferred_location_id)
      LEFT JOIN staffs ref ON FIND_IN_SET(ref.staff_id, st.staff_id)
      left join status_lists timetojoin on timetojoin.status_list_id = st.time_to_join_id
      left join status_lists ms on ms.status_list_id = st.martial_status_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const jobRoleDetails = await sequelize.query(`
      SELECT st.staff_id "staffId",st.date_of_joining "dateOfJoining",st.branch_id "branchId",
      st.department_id "departmentId",d.department_name "departmentName", 
      st.designation_id "designationId" ,d2.designation_name "designationName",
      st.role_id "roleId" , r.role_name "roleName",st.bank_account_id "bankAccountId",
      ba.account_holder_name "accountHolderName",ba.bank_name "bankName", ba.branch_name "branchName",
      ba.account_no "accountNo", ba.ifsc_code "ifscCode",
      st.user_id "userId", st.user_id "userCreditial"  ,u.user_name "userName",u.password "password", ssa.staff_salary_allocated_id "staffSalaryAllocatedId", ssa.annual_amount "annualAmount", ssa.monthly_amount "monthlyAmount", st.pf_required "pfRequired",  st.esi_required "esiRequired"
      FROM staffs st
      left join department d on d.department_id = st.department_id 
      left join users u on u.user_id = st.user_id 
      left join designation d2 on d2.designation_id = st.designation_id 
      left join role r on r.role_id = st.role_id  
      left join bank_accounts ba on ba.bank_account_id = st.bank_account_id 
      left join staff_salary_allocateds ssa on ssa.staff_id = st.staff_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });
    if (jobRoleDetails[0].password !== null && jobRoleDetails[0].password !== undefined) {
      const decrptpassword = await decrptPassword(jobRoleDetails[0].password);
      jobRoleDetails[0].password = decrptpassword;
    }

    const idProof = await sequelize.query(`
      SELECT st.staff_proof_id "staffProofId", st.staff_id "staffId", 
      st.proof_type_id "proofTypeId", st.proof_number "proofNumber",
      pt.proof_type_name "proofTypeName", st.proof_image_name "proofImageName", st.createdAt
      FROM staff_proofs st
      left join proof_types pt on pt.proof_type_id = st.proof_type_id ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const workExperience = await sequelize.query(`
      SELECT st.work_experience_id "workExperienceId", st.staff_id "staffId",
      st.organization_name "organizationName", st.position, st.years_of_experience "yearsOfExperience",
      st.from_date "fromDate", st.to_date "toDate", st.gross_pay "grossPay", st.work_location "workLocation",
      st.reason_for_leaving "reasonForLeaving", st.createdAt
      FROM work_experiences st ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const staffDetails = await sequelize.query(`
      SELECT st.staff_relation_details_id "staffRelationDetailsId", st.staff_id "staffId",
      st.relation_id "relationId", sl.status_name "relationTypeName", st.contact_no "contactNo", 
      st.qualification_id "qualificationId", sl2.status_name "qualificationName",
      st.occupation, st.createdAt, st.relation_name "relationName"
      FROM staff_relation_details st
      left join status_lists sl on sl.status_list_id = st.relation_id 
      left join status_lists sl2 on sl2.status_list_id = st.qualification_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const staffQualification = await sequelize.query(`
      SELECT staff_qualification_id "staffQualificationId", staff_id "staffId",
      qualification_id "qualificationId", sl.status_name "qualificationName", passing_year "passingYear", university_name "universityName",
      percentage, stream, st.createdAt
      FROM staff_qualifications st
      left join status_lists sl on sl.status_list_id = st.qualification_id ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const language = await sequelize.query(`
      SELECT staff_known_language_id "staffKnownLanguageId",
      staff_id "staffId", language_id "languageId",
      CASE WHEN language_speak = '1' THEN 'true' ELSE 'false' end as 'speak',
      CASE WHEN language_read = '1' THEN 'true'  ELSE 'false' end as 'read',
      CASE WHEN language_write = '1' THEN 'true' ELSE 'false' end as 'write',
      st.createdAt, sl.status_name "languageName"
      FROM staff_known_languages st
      left join status_lists sl on sl.status_list_id = st.language_id  ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const achievements = await sequelize.query(`
     SELECT st.staff_achievement_id "staffAchievementId", st.staff_id "staffId",
        st.achievement_at_id "achievementAtId",st.achievement_title_id "achievementTitleId", st.achievement_details "achievementDetails", ac_at.status_name "achievementAtName",
        ac_tit.status_name "achievementTitleName",
         st.createdAt
        FROM staff_achievements st
        left join status_lists ac_at  on ac_at.status_list_id = st.achievement_at_id
        left join status_lists ac_tit on ac_tit.status_list_id = st.achievement_title_id
         ${iql}`, {
      type: QueryTypes.SELECT,
      raw: true,
      nest: false
    });

    const result = {
      personalInfo: personalInfoData[0],
      jobRoleDetails: jobRoleDetails[0],
      idProof: idProof,
      workExperience: workExperience,
      staffQualification: staffQualification,
      staffDetails: staffDetails,
      language: language,
      achievements: achievements
    }
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createStaff(postData) {
  try {
    const applicantCodeFormat = `K3-WF-`
    const personalInfoData = postData.personalInfoData

    personalInfoData.pfRequired = postData.jobRoleDetails.pfRequired || 0;
    personalInfoData.esiRequired = postData.jobRoleDetails.esiRequired || 0;
    const userCreditial = postData?.jobRoleDetails?.userId || false
    if (userCreditial) {
      const userLogin = {
        userName: postData.jobRoleDetails?.userName || "",
        password: postData.jobRoleDetails?.password || "",
      }
      //User Creation
      const userResult = await createUser(userLogin)
      personalInfoData.userId = userResult[0].userId
    }
    //Bank Creation
    const bankRes = await createBankAccount(postData.jobRoleDetails)
    personalInfoData.bankAccountId = bankRes[0].bankAccountId

    const countResult = await sequelize.query(
      `SELECT staff_code "staffCode" FROM staffs
      ORDER BY staff_id DESC LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });

    const count = countResult.length > 0 ? parseInt(countResult[0].staffCode.split("-").pop()) : `00000`
    personalInfoData.staffCode = await generateSerialNumber(applicantCodeFormat, count)

    //  Staff Creation
    const excuteMethod = _.mapKeys(personalInfoData, (value, key) => _.snakeCase(key))
    const staffResult = await sequelize.models.staff.create(excuteMethod);

    //work experience Creation
    const workExperienceData = postData.workExperience.map(v => ({ ...v, staffId: staffResult.staff_id }))
    const workExperience = await createStaffWorkExperience(workExperienceData)

    // Language Known
    const languageData = postData.language.map(v => ({ ...v, staffId: staffResult.staff_id, languageSpeak: v?.speak === true ? 1 : 0 || 0, languageRead: v?.read === true ? 1 : 0 || 0, languageWrite: v?.write === true ? 1 : 0 || 0 }))
    const language = await createStaffKnownLanguage(languageData)

    // Staff Qualification
    const staffQualificationData = postData.staffQualification.map(v => ({ ...v, staffId: staffResult.staff_id }))
    const staffQualification = await createStaffQualification(staffQualificationData)

    // Relation Details
    const staffRelationData = postData.staffDetails.map(v => ({ ...v, staffId: staffResult.staff_id, qualificationId: v.realtionQualificationId }))
    const staffRelation = await createStaffRelation(staffRelationData)

    // Id Proofs 
    const proofInfoData = postData.idProof.map((v, i) => ({ ...v, staffId: staffResult.staff_id, proofImageName: `${personalInfoData.staffCode}-${v?.imageName || "Dummy"}-0${i}` }))
    const proofResult = await createStaffProof(proofInfoData)

    //salary Allocate
    const salaryAllocate = postData.jobRoleDetails
    salaryAllocate.staffId = staffResult.staff_id
    const salaryAllocateRes = await createStaffSalaryAllocate(salaryAllocate)

    //staff  Achievements
    const staffAchievementData = postData.staffAchievements.map((v, i) => ({ ...v, staffId: staffResult.staff_id }))
    const staffAchievementRes = await createStaffAchievement(staffAchievementData)


    const req = {
      staffId: staffResult.staff_id
    }
    return await getStaff(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaff(staffId, putData) {
  try {
    const personalInfoData = putData.personalInfoData
    const isuserCreditial = putData?.jobRoleDetails?.userId || false
    const userCreditialId = putData?.jobRoleDetails?.userCreditial || false
    const staffIdVal = personalInfoData.staffId
    personalInfoData.pfRequired = putData.jobRoleDetails.pfRequired || 0;
    personalInfoData.esiRequired = putData.jobRoleDetails.esiRequired || 0;
    //Staff Updation
    if (!isuserCreditial) {
      personalInfoData.userId = false;
    }

    if (isuserCreditial) {
      const userLogin = {
        userName: putData.jobRoleDetails?.userName || "",
        password: putData.jobRoleDetails?.password || "",
      }
      //User Creation
      const checkIfHaveUser = await sequelize.query(`SELECT user_id "userId" FROM users where user_id = ${userCreditialId}`, {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false
      });
      if (checkIfHaveUser[0].userId <= 0) {
        const userResult = await createUser(userLogin)
        personalInfoData.userId = userResult[0].userId
      }
      const userResult = await updateUser(userCreditialId, userLogin);
    } else {
      const userResult = await deleteUser(userCreditialId);
    }

    const excuteMethod = _.mapKeys(personalInfoData, (value, key) => _.snakeCase(key))
    excuteMethod.pf_required = personalInfoData.pfRequired || 0;
    excuteMethod.esi_required = personalInfoData.esiRequired || 0;
    const staffResult = await sequelize.models.staff.update(excuteMethod, { where: { staff_id: staffIdVal } });

    //bank update
    const BankDetails = putData.jobRoleDetails
    const bankDetailsReq = {
      bankName: BankDetails.bankName,
      branchName: BankDetails.branchName,
      accountHolderName: BankDetails.accountHolderName,
      accountNo: BankDetails.accountNo,
      ifscCode: BankDetails.ifscCode
    }
    const bankUpdateRes = await updateBankAccount(BankDetails.bankAccountId, bankDetailsReq)

    //job Salary Allocate Details
    const jobRoleDetails = putData.jobRoleDetails
    const salaryAllocateRes = await updateStaffSalaryAllocate(jobRoleDetails.staffSalaryAllocatedId, jobRoleDetails)

    // workExperience
    const workExperience = putData.workExperience
    const workExperienceRes = await updateStaffWorkExperience(staffId, workExperience)

    //language
    const languageData = putData.language
    const languageRes = await updateStaffKnownLanguage(staffId, languageData)

    //qualificationData
    const qualificationData = putData.staffQualification
    const qualificationRes = await updateStaffQualification(staffId, qualificationData)

    // Proof Details
    const proofData = putData.idProof
    const proofRes = await updateStaffProof(staffId, proofData)

    // Relation Details
    const relationData = putData.staffDetails
    const relationRes = await updateStaffRelation(staffId, relationData)

    //staff  Achievements
    const staffAchievementData = putData.staffAchievements
    const staffAchievementRes = await updateStaffAchievement(staffId, staffAchievementData)

    const req = {
      staffId: staffId
    }
    return await getStaff(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteStaff(staffId, putData) {
  try {
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const staffResult = await sequelize.models.staff.update(excuteMethod, { where: { staff_id: staffId } });
    const req = {
      staffId: staffId
    }
    return await getStaff(req);
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaff,
  updateStaff,
  createStaff,
  getStaffDetails,
  deleteStaff,
};