"use strict";

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");
const { generateSerialNumber } = require("../utils/utility");
const moment = require('moment');

// async function getStaffAttendance(query) {
//   try {
//     let iql = "";
//     let count = 0;
//     if (query && Object.keys(query).length) {
//       iql += `WHERE`;
//       if (query.staffAttendanceId) {
//         iql += count >= 1 ? ` AND` : ``;
//         count++;
//         iql += ` ts.staff_attendance_id = ${query.staffAttendanceId}`;
//       }
//       if (query.staffId) {
//         iql += count >= 1 ? ` AND` : ``;
//         count++;
//         iql += ` s.staff_id = ${query.staffId}`;
//       }
//       if (query.attendanceDate) {
//         iql += count >= 1 ? ` AND` : ``;
//         count++;
//         iql += ` ts.attendance_date = '${query.attendanceDate}'`;
//       }
//       if (query.branchId || query.branchId == '') {
//         if (query.branchId !== '') {
//           iql += count >= 1 ? ` AND` : ``;
//           count++;
//           iql += ` ts.branch_id = ${query.branchId}`;
//         }
//       }
//       if (query.departmentId || query.departmentId == '') {
//         if (query.departmentId !== '') {
//           iql += count >= 1 ? ` AND` : ``;
//           count++;
//           iql += ` ts.department_id = ${query.departmentId}`;
//         }
//       }
//     }

//     const result = await sequelize.query(
//       `SELECT ts.staff_attendance_id "staffAttendanceId",       
//       ts.staff_id "staffId",CONCAT(s.first_name,' ',s.last_name) as staffName,
//       s.staff_code "staffCode",
//       ts.attendance_status_id "attendanceStatusId",
//       ts.attendance_incharge_id  "attendanceInchargeId",
//       ts.attendance_date "attendanceDate",
//       b.branch_id "branchId",
//       b.branch_name "branchName",
//       d.department_id "departmentId",
//       d.department_name "departmentName"
//       FROM staffs s
//       left join branches b on b.branch_id = s.branch_id
//       left join department d on d.department_id = s.department_id
//       left join staff_attendances ts on ts.staff_id = s.staff_id or ( ts.attendance_date is null and ts.staff_id is null )  ${iql}`,

//       // const result = await sequelize.query(
//       //   `SELECT ts.staff_attendance_id "staffAttendanceId",
//       //   ts.staff_id "staffId",CONCAT(s.first_name,' ',s.last_name) as staffName,
//       //   s.staff_code "staffCode",
//       //   ts.attendance_status_id "attendanceStatusId",
//       //   ts.attendance_incharge_id	 "attendanceInchargeId",
//       //   ts.attendance_date "attendanceDate",
//       //   b.branch_id "branchId",
//       //   b.branch_name "branchName", 
//       //   d.department_id "departmentId",
//       //   d.department_name "departmentName"
//       //   FROM staff_attendances ts
//       //   left join branches b on b.branch_id = ts.branch_id
//       //   left join department d on d.department_id = ts.department_id
//       //   left join staffs s on s.staff_id = ts.staff_id ${iql}`,
//       {
//         type: QueryTypes.SELECT,
//         raw: true,
//         nest: false,
//       }
//     );
//     return result;
//   } catch (error) {
//     throw new Error(
//       error.message ? error.message
//         : messages.OPERATION_ERROR
//     );
//   }
// }

async function getStaffAttendance(query) {
  try {
    if (!query.attendanceDate) {
      throw new Error("attendanceDate is required to fetch attendance.");
    }

    const filters = [];

    if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
      if (String(query.branchId).includes(',')) {
        const branchIds = String(query.branchId)
          .split(',')
          .map(id => id.trim())
          .filter(id => id !== '' && id !== '0');
        if (branchIds.length > 0) {
          const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
          filters.push(`(${orConditions})`);
        }
      } else {
        filters.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
      }
    }

    if (query.departmentId && query.departmentId !== '') {
      filters.push(`s.department_id = ${query.departmentId}`);
    }

    if (query.staffId) {
      filters.push(`s.staff_id = ${query.staffId}`);
    }
    filters.push(`s.is_active = 1`);
    filters.push(`s.role_id != 1`);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const attendanceDate = query.attendanceDate;

    const result = await sequelize.query(
      `SELECT 
        s.staff_id AS "staffId",
        CONCAT(s.first_name, ' ', s.last_name) AS "staffName",
        s.staff_code AS "staffCode",
        s.staff_profile_image_name AS "staffProfile",
        COALESCE(ts.staff_attendance_id, 0) AS "staffAttendanceId",
        COALESCE(ts.attendance_status_id, 0) AS "attendanceStatusId",
        CASE 
          WHEN ts.attendance_status_id = 1 THEN 'present'
          WHEN ts.attendance_status_id = 2 THEN 'halfday'
          ELSE 'absent'
        END AS "attendanceStatus",
        ts.attendance_incharge_id AS "attendanceInchargeId",
        '${attendanceDate}' AS "attendanceDate",
        b.branch_id AS "branchId",
        b.branch_name AS "branchName",
        d.department_id AS "departmentId",
        d.department_name AS "departmentName"
      FROM staffs s
      LEFT JOIN staff_attendances ts 
        ON ts.staff_id = s.staff_id 
        AND ts.attendance_date = '${attendanceDate}'
      LEFT JOIN branches b ON b.branch_id = s.branch_id
      LEFT JOIN department d ON d.department_id = s.department_id
      ${whereClause}
      ORDER BY s.staff_id`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );

    return result;
  } catch (error) {
    throw new Error(error.message || "Operation error");
  }
}


// async function getStaffAttendanceList(query) {
//   try {
//     if (!query.attendanceDate) {
//       throw new Error("attendanceDate is required");
//     }

//     const filters = [];

//     if (query.branchId && query.branchId != 'null') {
//       if (query.branchId.includes(',')) {
//         const branchIds = query.branchId
//           .split(',')
//           .map(id => id.trim())
//           .filter(id => id !== '');
//         if (branchIds.length > 0) {
//           const orConditions = branchIds.map(id => `s.branch_id = ${id}`).join(' OR ');
//           filters.push(`(${orConditions})`);
//         }
//       } else {
//         filters.push(`s.branch_id = ${query.branchId}`);
//       }
//     }

//     if (query.staffId) {
//       filters.push(`s.staff_id = ${query.staffId}`);
//     }

//     filters.push(`s.staff_id != 1 AND s.is_active = 1`);

//     const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

//     const startDate = moment(query.attendanceDate).startOf("month").format("YYYY-MM-DD");
//     const endDate = moment(query.attendanceDate).endOf("month").format("YYYY-MM-DD");

//     const staffQuery = `
//       SELECT staff_id AS staffId,
//         s.staff_profile_image_name AS "staffProfile",
//         s.staff_code AS staffCode,
//         CONCAT(first_name, ' ', last_name) AS staffName 
//       FROM staffs s
//       ${whereClause}
//     `;
//     const allStaff = await sequelize.query(staffQuery, {
//       type: QueryTypes.SELECT,
//       raw: true,
//     });

//     const allDates = [];
//     let currentDate = moment(startDate);
//     while (currentDate.isSameOrBefore(endDate, "day")) {
//       allDates.push(currentDate.format("YYYY-MM-DD"));
//       currentDate.add(1, "day");
//     }

//     const attendanceRecords = await sequelize.query(
//       `SELECT sa.staff_attendance_id AS attendanceId, sa.staff_id AS staffId, 
//               sa.attendance_status_id AS attendanceStatusId, sa.attendance_date AS attendanceDate
//        FROM staff_attendances sa
//        WHERE sa.attendance_date BETWEEN '${startDate}' AND '${endDate}'
//        ORDER BY sa.attendance_date ASC`,
//       { type: QueryTypes.SELECT, raw: true }
//     );

//     let attendanceDetail = [];

//     allStaff.forEach((staff) => {
//       const filteredAttendanceRecords = attendanceRecords.filter(
//         (att) => att.staffId === staff.staffId
//       );

//       let staffAttendance = {
//         staffId: staff.staffId,
//         staffCode: staff.staffCode,
//         staffProfile: staff.staffProfile,
//         staffName: staff.staffName,
//         totalWorkingDays: 0, 
//         presentCount: 0,
//         absentCount: 0,
//         halfDayCount: 0,
//         dailyStatus: {},
//       };

//       allDates.forEach((date) => {
//         const dayOfWeek = moment(date).day(); // 0 = Sunday

//         if (dayOfWeek === 0) {
//           staffAttendance.dailyStatus[date] = "sunday";
//           return;
//         }

//         const record = filteredAttendanceRecords.find(
//           (att) => moment(att.attendanceDate).format("YYYY-MM-DD") === date
//         );

//         let statusText = "absent";
//         if (record) {
//           switch (record.attendanceStatusId) {
//             case 1:
//               staffAttendance.dailyStatus[date] = "present";
//               staffAttendance.presentCount++;
//               break;
//             case 2:
//               staffAttendance.dailyStatus[date] = "halfday";
//               staffAttendance.halfDayCount++;
//               break;
//             default:
//               staffAttendance.dailyStatus[date] = "absent";
//               staffAttendance.absentCount++;
//               break;
//           }
//           staffAttendance.totalWorkingDays++;
//         } else {
//           staffAttendance.dailyStatus[date] = "-"; // No record found
//           // Do NOT count it as absent or working day
//         }

//         // staffAttendance.dailyStatus[date] = statusText;
//         // staffAttendance.totalWorkingDays++;
//       });

//       attendanceDetail.push(staffAttendance);
//     });

//     return { attendanceDetail };
//   } catch (error) {
//     console.error("Error fetching staff attendance report:", error);
//     throw new Error(error.message || "Operation error");
//   }
// }

// 15-07-2025


async function getStaffAttendanceList1(query) {
  try {
    if (!query.attendanceDate) {
      throw new Error("attendanceDate is required");
    }

    const filters = [];

    if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
      if (String(query.branchId).includes(',')) {
        const branchIds = String(query.branchId)
          .split(',')
          .map(id => id.trim())
          .filter(id => id !== '' && id !== '0');
        if (branchIds.length > 0) {
          const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
          filters.push(`(${orConditions})`);
        }
      } else {
        filters.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
      }
    }

    if (query.staffId) {
      filters.push(`s.staff_id = ${query.staffId}`);
    }

    filters.push(`s.staff_id != 1 AND s.is_active = 1`);

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const startDate = moment(query.attendanceDate).startOf("month").format("YYYY-MM-DD");
    const endDate = moment(query.attendanceDate).endOf("month").format("YYYY-MM-DD");

    // Get all active staff based on filters
    const staffQuery = `
      SELECT staff_id AS staffId,
        s.staff_profile_image_name AS staffProfile,
        s.staff_code AS staffCode,
        CONCAT(first_name, ' ', last_name) AS staffName 
      FROM staffs s
      ${whereClause}
    `;
    const allStaff = await sequelize.query(staffQuery, {
      type: QueryTypes.SELECT,
      raw: true,
    });

    // Get all dates in the month
    const allDates = [];
    let currentDate = moment(startDate);
    while (currentDate.isSameOrBefore(endDate, "day")) {
      allDates.push(currentDate.format("YYYY-MM-DD"));
      currentDate.add(1, "day");
    }

    // Fetch attendance records for the month
    const attendanceRecords = await sequelize.query(
      `SELECT sa.staff_attendance_id AS attendanceId, sa.staff_id AS staffId, 
              sa.attendance_status_id AS attendanceStatusId, sa.attendance_date AS attendanceDate
       FROM staff_attendances sa
       WHERE sa.attendance_date BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY sa.attendance_date ASC`,
      { type: QueryTypes.SELECT, raw: true }
    );

    // Fetch holidays for the month
    const holidays = await sequelize.query(
      `SELECT holiday_date FROM holidays 
       WHERE holiday_date BETWEEN '${startDate}' AND '${endDate}'`,
      { type: QueryTypes.SELECT, raw: true }
    );
    const holidayDatesSet = new Set(holidays.map(h => moment(h.holiday_date).format('YYYY-MM-DD')));

    let attendanceDetail = [];

    allStaff.forEach((staff) => {
      const filteredAttendanceRecords = attendanceRecords.filter(
        (att) => att.staffId === staff.staffId
      );

      let staffAttendance = {
        staffId: staff.staffId,
        staffCode: staff.staffCode,
        staffProfile: staff.staffProfile,
        staffName: staff.staffName,
        totalWorkingDays: 0,
        presentCount: 0,
        absentCount: 0,
        halfDayCount: 0,
        dailyStatus: {},
      };

      allDates.forEach((date) => {
        const dayOfWeek = moment(date).day(); // 0 = Sunday

        if (dayOfWeek === 0) {
          staffAttendance.dailyStatus[date] = "sunday";
          return;
        }

        if (holidayDatesSet.has(date)) {
          staffAttendance.dailyStatus[date] = "holiday";
          return;
        }

        const record = filteredAttendanceRecords.find(
          (att) => moment(att.attendanceDate).format("YYYY-MM-DD") === date
        );

        if (record) {
          switch (record.attendanceStatusId) {
            case 1:
              staffAttendance.dailyStatus[date] = "present";
              staffAttendance.presentCount++;
              break;
            case 2:
              staffAttendance.dailyStatus[date] = "halfday";
              staffAttendance.halfDayCount++;
              break;
            default:
              staffAttendance.dailyStatus[date] = "absent";
              staffAttendance.absentCount++;
              break;
          }
          staffAttendance.totalWorkingDays++;
        } else {
          staffAttendance.dailyStatus[date] = "-"; // No data, not a holiday or Sunday
        }
      });

      attendanceDetail.push(staffAttendance);
    });

    return { attendanceDetail };
  } catch (error) {
    console.error("Error fetching staff attendance report:", error);
    throw new Error(error.message || "Operation error");
  }
}

async function getStaffAttendanceList(query) {
  try {
    // Check if either attendanceDate OR both fromDate and toDate are provided
    if (!query.attendanceDate && (!query.fromDate || !query.toDate)) {
      throw new Error("Either attendanceDate OR both fromDate and toDate are required");
    }

    const filters = [];
    
    if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
      if (String(query.branchId).includes(',')) {
        const branchIds = String(query.branchId)
          .split(',')
          .map(id => id.trim())
          .filter(id => id !== '' && id !== '0');
        if (branchIds.length > 0) {
          const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
          filters.push(`(${orConditions})`);
        }
      } else {
        filters.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
      }
    }
    
    if (query.staffId) {
      filters.push(`s.staff_id = ${query.staffId}`);
    }
    
    filters.push(`s.staff_id != 1 AND s.is_active = 1`);
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // Determine date range
    let startDate, endDate;
    if (query.attendanceDate) {
      // If attendanceDate is provided, use it as a month filter
      startDate = moment(query.attendanceDate).startOf("month").format("YYYY-MM-DD");
      endDate = moment(query.attendanceDate).endOf("month").format("YYYY-MM-DD");
    } else {
      // If fromDate and toDate are provided, use them directly
      startDate = moment(query.fromDate).format("YYYY-MM-DD");
      endDate = moment(query.toDate).format("YYYY-MM-DD");
    }

    // Validate date range
    if (moment(endDate).isBefore(startDate)) {
      throw new Error("toDate cannot be before fromDate");
    }

    // Get all active staff based on filters
    const staffQuery = `
      SELECT 
        staff_id AS staffId, 
        s.staff_profile_image_name AS staffProfile, 
        s.staff_code AS staffCode, 
        CONCAT(first_name, ' ', last_name) AS staffName
      FROM staffs s 
      ${whereClause}
    `;
    
    const allStaff = await sequelize.query(staffQuery, {
      type: QueryTypes.SELECT,
      raw: true,
    });

    // Get all dates in the range
    const allDates = [];
    let currentDate = moment(startDate);
    while (currentDate.isSameOrBefore(endDate, "day")) {
      allDates.push(currentDate.format("YYYY-MM-DD"));
      currentDate.add(1, "day");
    }

    // Fetch attendance records for the date range
    const attendanceRecords = await sequelize.query(
      `SELECT 
        sa.staff_attendance_id AS attendanceId, 
        sa.staff_id AS staffId, 
        sa.attendance_status_id AS attendanceStatusId, 
        sa.attendance_date AS attendanceDate
      FROM staff_attendances sa 
      WHERE sa.attendance_date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY sa.attendance_date ASC`,
      { type: QueryTypes.SELECT, raw: true }
    );

    // Fetch holidays for the date range
    const holidays = await sequelize.query(
      `SELECT holiday_date FROM holidays 
       WHERE holiday_date BETWEEN '${startDate}' AND '${endDate}'`,
      { type: QueryTypes.SELECT, raw: true }
    );
    
    const holidayDatesSet = new Set(holidays.map(h => moment(h.holiday_date).format('YYYY-MM-DD')));

    let attendanceDetail = [];
    
    allStaff.forEach((staff) => {
      const filteredAttendanceRecords = attendanceRecords.filter(
        (att) => att.staffId === staff.staffId
      );
      
      let staffAttendance = {
        staffId: staff.staffId,
        staffCode: staff.staffCode,
        staffProfile: staff.staffProfile,
        staffName: staff.staffName,
        totalWorkingDays: 0,
        presentCount: 0,
        absentCount: 0,
        halfDayCount: 0,
        dateRange: {
          fromDate: startDate,
          toDate: endDate
        },
        dailyStatus: {},
      };

      allDates.forEach((date) => {
        const dayOfWeek = moment(date).day(); // 0 = Sunday
        
        if (dayOfWeek === 0) {
          staffAttendance.dailyStatus[date] = "sunday";
          return;
        }
        
        if (holidayDatesSet.has(date)) {
          staffAttendance.dailyStatus[date] = "holiday";
          return;
        }

        const record = filteredAttendanceRecords.find(
          (att) => moment(att.attendanceDate).format("YYYY-MM-DD") === date
        );

        if (record) {
          switch (record.attendanceStatusId) {
            case 1:
              staffAttendance.dailyStatus[date] = "present";
              staffAttendance.presentCount++;
              break;
            case 2:
              staffAttendance.dailyStatus[date] = "halfday";
              staffAttendance.halfDayCount++;
              break;
            default:
              staffAttendance.dailyStatus[date] = "absent";
              staffAttendance.absentCount++;
              break;
          }
          staffAttendance.totalWorkingDays++;
        } else {
          staffAttendance.dailyStatus[date] = "-"; // No data, not a holiday or Sunday
        }
      });
      
      attendanceDetail.push(staffAttendance);
    });

    return { 
      attendanceDetail,
      meta: {
        dateRange: {
          fromDate: startDate,
          toDate: endDate,
          totalDays: allDates.length
        }
      }
    };
    
  } catch (error) {
    console.error("Error fetching staff attendance report:", error);
    throw new Error(error.message || "Operation error");
  }
}


async function getStaffAttendanceReport(query) {
  try {
    let filters = [];

    if (query && Object.keys(query).length) {
      if (query.staffAttendanceId) {
        filters.push(`ts.staff_attendance_id = ${query.staffAttendanceId}`);
      }

      if (query.staffId) {
        filters.push(`s.staff_id = ${query.staffId}`);
      }

      if (query.attendanceDate && query.durationId == 0) {
        filters.push(`ts.attendance_date = '${query.attendanceDate}'`);
      }

      if (query.durationId) {
        const startDate = moment(query.attendanceDate)
          .startOf(query.durationId == 2 ? 'year' : 'month')
          .format('YYYY-MM-DD');
        const endDate = moment(query.attendanceDate)
          .endOf(query.durationId == 2 ? 'year' : 'month')
          .format('YYYY-MM-DD');
        filters.push(`ts.attendance_date BETWEEN '${startDate}' AND '${endDate}'`);
      }

      if (query.branchId && query.branchId !== '0' && query.branchId !== 0 && query.branchId !== 'null') {
        if (String(query.branchId).includes(',')) {
          const branchIds = String(query.branchId)
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '' && id !== '0');
          if (branchIds.length > 0) {
            const orConditions = branchIds.map(id => `FIND_IN_SET('${id}', s.branch_id) > 0`).join(' OR ');
            filters.push(`(${orConditions})`);
          }
        } else {
          filters.push(`FIND_IN_SET('${query.branchId}', s.branch_id) > 0`);
        }
      }

      if (query.departmentId || query.departmentId === '') {
        if (query.departmentId !== '') {
          filters.push(`ts.department_id = ${query.departmentId}`);
        }
      }
    }

    filters.push(`s.is_active = 1`);
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await sequelize.query(
      `SELECT ts.staff_attendance_id "staffAttendanceId",
      ts.staff_id "staffId",CONCAT(s.first_name,' ',s.last_name) as staffName,
      s.staff_code "staffCode",
      ts.attendance_status_id "attendanceStatusId",
      ts.attendance_incharge_id  "attendanceInchargeId",
      ts.attendance_date "attendanceDate",
      b.branch_id "branchId",
      b.branch_name "branchName",
      d.department_id "departmentId",
      d.department_name "departmentName",
    	SUM(CASE WHEN ts.attendance_status_id = 0 AND per.permission_type_id IS NULL THEN 1 ELSE 0 END) AS "absentDays",
    	SUM(CASE WHEN ts.attendance_status_id = 1 AND per.permission_type_id IS NULL THEN 1 ELSE 0 END) AS "presentDays",
    	SUM(CASE WHEN per.permission_type_id = 39 THEN 1 ELSE 0 END) AS "halfDays",
      DAY(LAST_DAY('${moment(query.attendanceDate).format('YYYY-MM-DD')}')) "workingDays"
      FROM staffs s
      left join branches b on b.branch_id = s.branch_id
      left join department d on d.department_id = s.department_id
      left join staff_attendances ts on ts.staff_id = s.staff_id or ( ts.attendance_date is null and ts.staff_id is null )
      left join permissions per on per.staff_id = s.staff_id and per.permission_date = ts.attendance_date and per.status_id = 29 and per.is_active = 1
       ${whereClause}
      GROUP BY 
        s.staff_id, s.first_name, s.last_name, s.staff_code, b.branch_name, d.department_name
      ORDER BY 
        s.staff_id`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );
    return result;
  } catch (error) {
    throw new Error(
      error.message ? error.message
        : messages.OPERATION_ERROR
    );
  }
}

async function createStaffAttendance(postData) {
  try {
    const excuteMethod = _.map(postData.staffAttendance, (item) =>
      _.mapKeys(item, (value, key) => _.snakeCase(key))
    );
    const staffAttendanceResult =
      await sequelize.models.staff_attendance.bulkCreate(excuteMethod);

    const req = {
      attendanceDate: postData.staffAttendance[0].attendanceDate,
    };
    return await getStaffAttendance(req);
  } catch (error) {
    throw new Error(
      error.message ? error.message
        : messages.OPERATION_ERROR
    );
  }
}

async function updateStaffAttendance(putData) {
  try {
    const attendanceList = _.map(putData.staffAttendance, (item) =>
      _.mapKeys(item, (value, key) => _.snakeCase(key))
    );

    for (const attendanceData of attendanceList) {
      const { staff_id, attendance_date } = attendanceData;

      const [existing] = await sequelize.query(
        `SELECT *
         FROM staff_attendances
         WHERE staff_id = '${staff_id}'
           AND DATE(attendance_date) = '${attendance_date}'
         LIMIT 1`,
        {
          type: QueryTypes.SELECT,
          raw: true,
          nest: false,
        }
      );


      if (existing) {
        await sequelize.models.staff_attendance.update(attendanceData, {
          where: {
            staff_attendance_id: existing.staff_attendance_id,
          },
        });
      } else {
        await sequelize.models.staff_attendance.create(attendanceData);
      }
    }

    const req = {
      attendanceDate: putData.staffAttendance[0].attendanceDate,
    };

    return await getStaffAttendance(req);
  } catch (error) {
    throw new Error(
      error.message ? error.message : messages.OPERATION_ERROR
    );
  }
}


async function getAdminAttendance(query) {
  try {
    if (!query.date) {
      throw new Error("date parameter is required (YYYY-MM-DD)");
    }
    const queryDate = query.date;
    const startOfDay = moment(queryDate).startOf('day').valueOf();
    const endOfDay = moment(queryDate).endOf('day').valueOf();

    // 1. Get all active staff (excluding Super Admin role_id = 1)
    const activeStaff = await sequelize.query(
      `SELECT staff_id AS "staffId", CONCAT(first_name, ' ', last_name) AS "staffName", branch_id AS "branchId", department_id AS "departmentId"
       FROM staffs
       WHERE is_active = 1 AND role_id != 1`,
      { type: QueryTypes.SELECT }
    );

    if (!activeStaff || activeStaff.length === 0) {
      return [];
    }

    // 2. Fetch all punch records on that day
    const punchRecords = await sequelize.query(
      `SELECT staff_id AS "staffId", action_type AS "actionType", record_created_at AS "recordCreatedAt"
       FROM time_intervals
       WHERE record_created_at BETWEEN :startOfDay AND :endOfDay
         AND action_type IN ('Punch In-Tracker', 'Punch Out-Tracker')
       ORDER BY record_created_at ASC`,
      {
        replacements: { startOfDay, endOfDay },
        type: QueryTypes.SELECT
      }
    );

    // Group punch records by staffId
    const punchesByStaff = {};
    punchRecords.forEach(rec => {
      if (!punchesByStaff[rec.staffId]) {
        punchesByStaff[rec.staffId] = [];
      }
      punchesByStaff[rec.staffId].push(rec);
    });

    const response = [];

    for (const staff of activeStaff) {
      const staffId = staff.staffId;
      const staffPunches = punchesByStaff[staffId] || [];

      const inPunches = staffPunches.filter(p => p.actionType === 'Punch In-Tracker');
      const outPunches = staffPunches.filter(p => p.actionType === 'Punch Out-Tracker');

      const punchInTime = inPunches.length > 0 ? Math.min(...inPunches.map(p => p.recordCreatedAt)) : null;
      const punchOutTime = outPunches.length > 0 ? Math.max(...outPunches.map(p => p.recordCreatedAt)) : null;

      let workingHours = 0;
      let attendanceStatus = 'ABSENT';

      if (punchInTime) {
        if (punchOutTime && punchOutTime > punchInTime) {
          workingHours = parseFloat(((punchOutTime - punchInTime) / 3600000).toFixed(2));
          attendanceStatus = workingHours < 4 ? 'HALF_DAY' : 'FULL_DAY';
        } else {
          workingHours = 0;
          attendanceStatus = 'HALF_DAY';
        }
      }

      // Store in staff_attendances database table if punch_in exists
      if (punchInTime) {
        const statusId = attendanceStatus === 'HALF_DAY' ? 2 : 1;
        const [existing] = await sequelize.query(
          `SELECT staff_attendance_id 
           FROM staff_attendances 
           WHERE staff_id = :staffId AND attendance_date = :queryDate 
           LIMIT 1`,
          {
            replacements: { staffId, queryDate },
            type: QueryTypes.SELECT
          }
        );

        if (existing) {
          await sequelize.query(
            `UPDATE staff_attendances 
             SET attendance_status_id = :statusId, updatedAt = CURRENT_TIMESTAMP
             WHERE staff_attendance_id = :attendanceId`,
            {
              replacements: { statusId, attendanceId: existing.staff_attendance_id }
            }
          );
        } else {
          await sequelize.query(
            `INSERT INTO staff_attendances (staff_id, attendance_date, branch_id, department_id, attendance_status_id, attendance_incharge_id, createdAt, updatedAt)
             VALUES (:staffId, :queryDate, :branchId, :departmentId, :statusId, :staffId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            {
              replacements: {
                staffId,
                queryDate,
                branchId: staff.branchId,
                departmentId: staff.departmentId,
                statusId
              }
            }
          );
        }
      }

      response.push({
        user_id: staffId,
        employee_name: staff.staffName,
        punch_in: punchInTime ? moment(punchInTime).format('YYYY-MM-DD HH:mm:ss') : null,
        punch_out: punchOutTime ? moment(punchOutTime).format('YYYY-MM-DD HH:mm:ss') : null,
        working_hours: workingHours,
        attendance_status: attendanceStatus
      });
    }

    return response;
  } catch (error) {
    throw new Error(error.message || "Operation error");
  }
}

module.exports = {
  getStaffAttendance,
  updateStaffAttendance,
  getStaffAttendanceList,
  createStaffAttendance,
  getStaffAttendanceReport,
  getAdminAttendance,
};
