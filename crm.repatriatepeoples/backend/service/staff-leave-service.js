"use strict";

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");
const moment = require('moment');
const { ACCESS_IDS, hasPageAccess } = require("./access-service");

async function getStaffLeave(query) {
  try {
    let iql = "";
    let count = 0;
    if (query && Object.keys(query).length) {
      iql += `WHERE`;
      if (query.staffLeaveId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sl.staff_leave_id = ${query.staffLeaveId}`;
      }
      if (query.fromDate) { // Month and year based for Report
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` (sl.from_date <= '${moment(query.toDate).format('YYYY-MM-DD')}' 
                  AND sl.to_date >= '${moment(query.fromDate).format('YYYY-MM-DD')}')`;
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

      if (query.statusId) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sl.status_id = ${query.statusId}`;
      }
      if (query.departmentId || query.departmentId == '') {
        if (query.departmentId !== '') {
          iql += count >= 1 ? ` AND` : ``;
          count++;
          iql += ` s.department_id = ${query.departmentId}`;
        }
      }
      if (query.attendanceDate) {
        iql += count >= 1 ? ` AND` : ``;
        count++;
        iql += ` sl.from_date <= '${query.attendanceDate}' AND '${query.attendanceDate}' <= sl.to_date`;
      }
    }
    const result = await sequelize.query(
      `SELECT sl.staff_leave_id "staffLeaveId", sl.staff_id "staffId",
       s.staff_profile_image_name AS "staffProfile",
        sl.leave_type_id "leaveTypeId",sl3.status_name "leaveTypeName",CONCAT(sur.status_name,'.',s.first_name,' ',s.last_name) as staffName,
        sl.day_count "dayCount", sl.reason, sl.from_date "fromDate",
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

        FROM staff_leaves sl
        left join staffs s on s.staff_id = sl.staff_id 
      left join staffs sp on sp.staff_id = sl.spoken_staff_id
        left join status_lists sl2 on sl2.status_list_id = sl.status_id 

      left join designation des on des.designation_id = s.designation_id
      left join department dep on dep.department_id = s.department_id
      
      left join designation des_sp on des_sp.designation_id = sp.designation_id
      left join department dep_sp on dep_sp.department_id = sp.department_id

      left join status_lists sur on sur.status_list_id = s.surname_id 
      left join status_lists sur_sp on sur_sp.status_list_id = sp.surname_id 
        left join status_lists sl3 on sl3.status_list_id = sl.leave_type_id  ${iql}
        ORDER BY sl.staff_leave_id DESC`,
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

// async function getStaffRemainingLeave(query) {
//   try {
//     let iql = "";

//     let filters = [];
//     if (query && Object.keys(query).length) {
//       if (query.branchId && query.branchId != '' && query.branchId != 0) {
//         filters.push(`st.branch_id = ${query.branchId}`);
//       }
//       if (query.departmentId && query.departmentId != '' && query.departmentId != 0) {
//         filters.push(`st.department_id = ${query.departmentId}`);
//       }
//       if (query.staffId) {
//         filters.push(`st.staff_id = ${query.staffId}`);
//         query.yearOrMonth = 2
//       }
//     }
//     filters.push(`st.is_active = 1`);
//     filters.push(`st.staff_id <> 1`);

//     if (filters.length > 0) {
//       iql += `WHERE ` + filters.join(' AND ');
//     }

//     const yearMonth = query.year || moment().format("YYYY-MM"); // expected format 'YYYY-MM'
//     const yearPart = moment(yearMonth, "YYYY-MM").year();
//     const monthPart = moment(yearMonth, "YYYY-MM").month() + 1; // 0-based index

//     let fromDate, toDate;

//     if (query.yearOrMonth == 2) {
//       // Monthly Mode
//       const month = moment(`${yearPart}-${monthPart}-01`);
//       fromDate = month.startOf('month').format('YYYY-MM-DD');
//       toDate = month.endOf('month').format('YYYY-MM-DD');
//     } else {
//       // Financial Year Mode
//       const financialYearStart = monthPart < 4 ? yearPart - 1 : yearPart;
//       fromDate = `${financialYearStart}-04-01`;
//       toDate = `${financialYearStart + 1}-03-31`;
//     }

//     const result = await sequelize.query(
//       `SELECT 
//         st.staff_id AS staffId,
//         CONCAT(st.first_name, ' ', st.last_name) AS staffName,

//         (
//           SELECT COALESCE(SUM(day_count), 0)
//           FROM staff_leaves sl
//           WHERE sl.staff_id = st.staff_id AND sl.status_id = 29
//             AND ${query.yearOrMonth == 2
//         ? `DATE_FORMAT(sl.from_date, "%Y-%m") = '${yearMonth}'`
//         : `sl.from_date >= '${fromDate}' AND sl.to_date <= '${toDate}'`
//       }
//         ) AS totalTakenLeave,

//         -- Casual leave: count of months with >=1 day leave
//         (
//           SELECT COUNT(1)
//           FROM (
//             SELECT DATE_FORMAT(from_date, '%Y-%m') AS leaveMonth
//             FROM staff_leaves
//             WHERE staff_id = st.staff_id AND status_id = 29
//               AND ${query.yearOrMonth == 2
//         ? `DATE_FORMAT(from_date, "%Y-%m") = '${yearMonth}'`
//         : `from_date >= '${fromDate}' AND to_date <= '${toDate}'`
//       }
//             GROUP BY leaveMonth
//             HAVING SUM(day_count) >= 1
//           ) AS monthlyCasual
//         ) AS casualLeave,

//         -- Less of Pay: sum of (days - 1) if days > 1 in a month
//         (
//           SELECT COALESCE(SUM(extraDays), 0)
//           FROM (
//             SELECT 
//               CASE 
//                 WHEN SUM(day_count) > 1 THEN SUM(day_count) - 1 
//                 ELSE 0 
//               END AS extraDays
//             FROM staff_leaves
//             WHERE staff_id = st.staff_id AND status_id = 29
//               AND ${query.yearOrMonth == 2
//         ? `DATE_FORMAT(from_date, "%Y-%m") = '${yearMonth}'`
//         : `from_date >= '${fromDate}' AND to_date <= '${toDate}'`
//       }
//             GROUP BY DATE_FORMAT(from_date, '%Y-%m')
//           ) AS monthlyExcess
//         ) AS lessOfPayLeave,

//         -- Remaining leave (for year mode only)
//         CASE 
//   WHEN ${query.yearOrMonth} = 4 THEN 
//     GREATEST(12 - (
//       SELECT COUNT(1)
//       FROM (
//         SELECT DATE_FORMAT(from_date, '%Y-%m') AS leaveMonth
//         FROM staff_leaves
//         WHERE staff_id = st.staff_id AND status_id = 29
//           AND from_date >= '${fromDate}' AND to_date <= '${toDate}'
//         GROUP BY leaveMonth
//         HAVING SUM(day_count) >= 1
//       ) AS yearCasual
//     ), 0)
//   WHEN ${query.yearOrMonth} = 2 THEN
//     CASE
//       WHEN EXISTS (
//         SELECT 1
//         FROM staff_leaves
//         WHERE staff_id = st.staff_id AND status_id = 29
//           AND DATE_FORMAT(from_date, '%Y-%m') = '${query.year}'
//         GROUP BY DATE_FORMAT(from_date, '%Y-%m')
//         HAVING SUM(day_count) >= 1
//       ) THEN 0
//       ELSE 1
//     END
//   ELSE 0
// END AS remainingLeave


//       FROM staffs st
//       ${iql}
//       GROUP BY st.staff_id
//       ORDER BY st.staff_id`,
//       {
//         type: QueryTypes.SELECT,
//         raw: true,
//         nest: false,
//       }
//     );

//     return result;
//   } catch (error) {
//     throw new Error(error.message || "Operation failed");
//   }
// }


async function getStaffRemainingLeave(query) {
  try {
    let iql = "";
    let filters = [];
    if (query && Object.keys(query).length) {
      if (query.branchId && query.branchId != '' && query.branchId != 0) {
        filters.push(`st.branch_id = ${query.branchId}`);
      }
      if (query.departmentId && query.departmentId != '' && query.departmentId != 0) {
        filters.push(`st.department_id = ${query.departmentId}`);
      }
      if (query.staffId) {
        filters.push(`st.staff_id = ${query.staffId}`);
        query.yearOrMonth = 2
      }
    }
    filters.push(`st.is_active = 1`);
    filters.push(`st.staff_id <> 1`);

    if (filters.length > 0) {
      iql += `WHERE ` + filters.join(' AND ');
    }

    const yearMonth = query.year || moment().format("YYYY-MM"); // expected format 'YYYY-MM'
    const yearPart = moment(yearMonth, "YYYY-MM").year();
    const monthPart = moment(yearMonth, "YYYY-MM").month() + 1; // 0-based index

    let fromDate, toDate;

    if (query.yearOrMonth == 2) {
      // Monthly Mode
      const month = moment(`${yearPart}-${monthPart}-01`);
      fromDate = month.startOf('month').format('YYYY-MM-DD');
      toDate = month.endOf('month').format('YYYY-MM-DD');
    } else {
      // Financial Year Mode
      const financialYearStart = monthPart < 4 ? yearPart - 1 : yearPart;
      fromDate = `${financialYearStart}-04-01`;
      toDate = `${financialYearStart + 1}-03-31`;
    }

    const result = await sequelize.query(
      `SELECT 
    st.staff_id AS staffId,
    st.staff_code AS staffCode,
    st.staff_profile_image_name AS "staffProfile",
    CONCAT(st.first_name, ' ', st.last_name) AS staffName,
    COALESCE(ls.totalTakenLeave, 0) AS totalTakenLeave,
    COALESCE(ls.casualLeave, 0) AS casualLeave,
    COALESCE(ls.lessOfPayLeave, 0) AS lessOfPayLeave,
    
    CASE 
        WHEN :yearOrMonth = 4 THEN 
            GREATEST(12 - COALESCE(ls.casualLeave, 0), 0)
        WHEN :yearOrMonth = 2 THEN 
            CASE 
                WHEN COALESCE(ls.casualLeave, 0) >= 1 THEN 0 
                ELSE 1 
            END
        ELSE 0
    END AS remainingLeave

FROM staffs st
LEFT JOIN (
    SELECT 
        sl.staff_id,
        SUM(sl.day_count) AS totalTakenLeave,
        
        COUNT(DISTINCT DATE_FORMAT(sl.from_date, '%Y-%m')) AS casualLeave,
        
        SUM(
            CASE 
                WHEN month_total > 1 THEN month_total - 1 
                ELSE 0 
            END
        ) AS lessOfPayLeave
    FROM staff_leaves sl
    JOIN (
        SELECT 
            staff_id,
            DATE_FORMAT(from_date, '%Y-%m') AS leaveMonth,
            SUM(day_count) AS month_total
        FROM staff_leaves
        WHERE status_id = 29
            AND from_date BETWEEN :fromDate AND :toDate
        GROUP BY staff_id, leaveMonth
    ) AS monthly ON sl.staff_id = monthly.staff_id 
    AND DATE_FORMAT(sl.from_date, '%Y-%m') = monthly.leaveMonth
    WHERE sl.status_id = 29
      AND sl.from_date BETWEEN :fromDate AND :toDate
    GROUP BY sl.staff_id
) AS ls ON ls.staff_id = st.staff_id

${iql}
ORDER BY st.staff_id;
`,
      {
        type: QueryTypes.SELECT,
        replacements: {
          fromDate,
          toDate,
          yearOrMonth: query.yearOrMonth || 2 // or 4 depending on mode
        },
        // raw: true,
        // nest: false,
      }
    );

    return result;
  } catch (error) {
    throw new Error(error.message || "Operation failed");
  }
}

async function createStaffLeave(postData) {
  try {
    const checkPerviousApplyLeave = await sequelize.query(
      `SELECT sl.staff_leave_id "staffLeaveId"
      FROM staff_leaves sl
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

    if (checkPerviousApplyLeave.length <= 0) {
      const excuteMethod = _.mapKeys(postData, (value, key) =>
        _.snakeCase(key)
      );
      const staffLeaveResult = await sequelize.models.staff_leave.create(
        excuteMethod
      );
      const req = {
        staffLeaveId: staffLeaveResult.staff_leave_id,
      };
      return await getStaffLeave(req);
    } else {
      throw new Error(messages.LEAVE_APPLIED_BEFORE);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateStaffLeave(staffLeaveId, putData, user) {
  try {
    if (putData.statusId === 29 || putData.statusId === 30) {
      const requiredAccessId = putData.statusId === 29 ? ACCESS_IDS.APPROVED : ACCESS_IDS.REJECTED;
      const allowed = await hasPageAccess(user.staffId, "/staff/staff-leave", requiredAccessId);
      if (!allowed) {
        throw new Error("Not authorized to " + (putData.statusId === 29 ? "approve" : "reject") + " leave requests");
      }
    }
    // check is cancelled or not
    if (putData.statusId == 28) {
      const checkPerviousApplyLeave = await sequelize.query(
        `SELECT sl.staff_leave_id "staffLeaveId"
          FROM staff_leaves sl
          WHERE (
             '${putData.fromDate}' <= sl.to_date 
              AND '${putData.toDate}' >= sl.from_date AND sl.staff_id = ${putData.staffId} AND sl.status_id != 30 AND sl.staff_leave_id <> ${staffLeaveId}
          )`,
        {
          type: QueryTypes.SELECT,
          raw: true,
          nest: false,
        }
      );


      if (checkPerviousApplyLeave.length <= 0) {
        const excuteMethod = _.mapKeys(putData, (value, key) =>
          _.snakeCase(key)
        );

        const staffLeaveResult = await sequelize.models.staff_leave.update(
          excuteMethod,
          { where: { staff_leave_id: staffLeaveId } }
        );
        const req = {
          staffLeaveId: staffLeaveId,
        };
        return await getStaffLeave(req);
      } else {
        throw new Error(messages.LEAVE_APPLIED_BEFORE);
      }
    } else {
      const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));
      const staffLeaveResult = await sequelize.models.staff_leave.update(
        excuteMethod,
        { where: { staff_leave_id: staffLeaveId } }
      );
      const req = {
        staffLeaveId: staffLeaveId,
      };
      return await getStaffLeave(req);
    }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getStaffLeave,
  updateStaffLeave,
  createStaffLeave,
  getStaffRemainingLeave,
};
