"use strict";
const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");
const moment = require('moment');

// async function getTimeIntervals(query) {
//   try {
//     let filters = [];
//     if (query && Object.keys(query).length) {
//       if (query.staffId) {
//         filters.push(`ti.staff_id = ${query.staffId}`);
//       }
     
//       if (query.date) {
//   filters.push(`DATE_FORMAT(ti.created_at, '%Y-%m-%d') = ?`);
//   replacements.push(query.date);
// }
//       // if (query.startDate && query.endDate) {
//       //   filters.push(
//       //     `ti.record_created_at BETWEEN ${query.startDate} AND ${query.endDate}`
//       //   );
//       // }

//        if (query.actionType) {
//         filters.push(`ti.action_type = '${query.actionType}'`);
//       } else if (query.requestActionType == 1) {
//         filters.push(`ti.action_type = 'Punch In-Tracker'`);
//       } else if (query.requestActionType == 2) {
//         filters.push(`(ti.action_type = 'Visit Out-Tracker' OR ti.action_type = 'Visit In-Tracker')`);
//       }
//       if (query.attendanceMarkType) {
//         filters.push(`ti.attendance_mark_type = ${query.attendanceMarkType}`);
//       }
//     }

//     const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

//     const result = await sequelize.query(
//       ` 
//       SELECT 
//         ti.id,
//         ti.staff_id as "staffId",
//         ti.time_status as "timeStatus",
//         ti.attendance_mark_type as "attendanceMarkType",
//         ti.status,
//         ti.attendance_type as "attendanceType",
//         ti.image_name as "imageName",
//         ti.network_status as "networkStatus",
//         ti.battery,
//         ti.flight_mode as "flightMode",
//         ti.address,
//         ti.brand,
//         ti.manufacturer,
//         ti.board,
//         ti.device,
//         ti.display,
//         ti.hardware,
//         ti.model,
//         ti.product,
//         ti.updated_at as "updatedAt",
//         ti.latitude,
//         ti.longitude,
//         ti.coordinates,
//         ti.mongo_id as "mongoId",
//         ti.action_type as "actionType",
//         ti.record_created_at as "recordCreatedAt",
//         ti.coordinates_points as "coordinatesPoints",
//         ti.work_time as "workTime",
//         ti.total_work_time as "totalWorkTime",
//         ti.distance,
//         ti.speed,
//         ti.km_difference as "kmDifference",
//         ti.time_travelled as "timeTravelled",
//         ti.mobile_status as "mobileStatus",
//         ti.image_url as "imageUrl",
//         ti.form_detail_id as "formDetailId",
//         ti.form_id as "formId",
//         ti.client_form as "clientForm",
//         ti.branch_visit as "branchVisit",
//         ti.centre_no_name as "centreNoName",
//         ti.member_name as "memberName",
//         ti.collection_amount as "collectionAmount",
//         ti.cell_no_name as "cellNoName",
//         ti.attachment,
//         ti.next_due_date as "nextDueDate",
//         ti.createdAt,
//         ti.updatedAt,
//         CONCAT(s.first_name, ' ', s.last_name) as "staffName",
//         s.staff_code as "staffCode"
//       FROM time_intervals ti
//       LEFT JOIN staffs s ON s.staff_id = ti.staff_id
//       ${whereClause}
//       ORDER BY ti.record_created_at DESC
//       `,
//       {
//         type: QueryTypes.SELECT,
//         raw: true,
//         nest: false,
//       }
//     );

//     return result;
//   } catch (error) {
//     throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
//   }
// }

async function getTimeIntervals1(query) {
  try {
    // Debug: Check table structure
    const tableInfo = await sequelize.query(
      `SHOW COLUMNS FROM time_intervals`,
      { type: QueryTypes.SELECT }
    );
    console.log('Time Intervals table columns:', tableInfo);

    let filters = [];
    let replacements = [];
    
    if (query && Object.keys(query).length) {
      if (query.staffId) {
        filters.push(`ti.staff_id = ?`);
        replacements.push(query.staffId);
      }
     
      if (query.date) {
        // Check which date column exists and use it
        const hasCreatedAt = tableInfo.some(col => col.Field === 'createdAt');
        const hasRecordCreatedAt = tableInfo.some(col => col.Field === 'record_created_at');
        
        console.log('Date columns found:', { hasCreatedAt, hasRecordCreatedAt });
        
        if (hasCreatedAt) {
          // Use createdAt (Sequelize default)
          filters.push(`DATE_FORMAT(ti.createdAt, '%Y-%m-%d') = ?`);
          replacements.push(query.date);
        } else if (hasRecordCreatedAt) {
          // Use record_created_at (your custom timestamp)
          const startDate = new Date(query.date);
          const endDate = new Date(query.date);
          endDate.setDate(endDate.getDate() + 1);
          
          filters.push(`ti.record_created_at BETWEEN ? AND ?`);
          replacements.push(startDate.getTime(), endDate.getTime() - 1);
        }
      }

      if (query.actionType) {
        filters.push(`ti.action_type = ?`);
        replacements.push(query.actionType);
      } else if (query.requestActionType == 1) {
        filters.push(`(ti.action_type = ? OR ti.action_type = ?)`);
        replacements.push('Punch In-Tracker','Punch Out-Tracker');
      } else if (query.requestActionType == 2) {
        filters.push(`(ti.action_type = ? OR ti.action_type = ?)`);
        replacements.push('Visit Out-Tracker', 'Visit In-Tracker');
      }
      
      if (query.attendanceMarkType && query.attendanceMarkType !== 'null') {
        filters.push(`ti.attendance_mark_type = ?`);
        replacements.push(query.attendanceMarkType);
      }
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    
    console.log('Final query with date column:', whereClause);

    const result = await sequelize.query(
      ` 
      SELECT 
        ti.id,
        ti.staff_id as "staffId",
        ti.time_status as "timeStatus",
        ti.attendance_mark_type as "attendanceMarkType",
        ti.status,
        ti.attendance_type as "attendanceType",
        ti.image_name as "imageName",
        ti.network_status as "networkStatus",
        ti.battery,
        ti.flight_mode as "flightMode",
        ti.address,
        ti.brand,
        ti.manufacturer,
        ti.board,
        ti.device,
        ti.display,
        ti.hardware,
        ti.model,
        ti.product,
        ti.updated_at as "updatedAt",
        ti.latitude,
        ti.longitude,
        ti.coordinates,
        ti.mongo_id as "mongoId",
        ti.action_type as "actionType",
        ti.record_created_at as "recordCreatedAt",
        ti.coordinates_points as "coordinatesPoints",
        ti.work_time as "workTime",
        ti.total_work_time as "totalWorkTime",
        ti.distance,
        ti.speed,
        ti.km_difference as "kmDifference",
        ti.time_travelled as "timeTravelled",
        ti.mobile_status as "mobileStatus",
        ti.image_url as "imageUrl",
        ti.form_detail_id as "formDetailId",
        ti.form_id as "formId",
        ti.client_form as "clientForm",
        ti.branch_visit as "branchVisit",
        ti.centre_no_name as "centreNoName",
        ti.member_name as "memberName",
        ti.collection_amount as "collectionAmount",
        ti.cell_no_name as "cellNoName",
        ti.attachment,
        ti.next_due_date as "nextDueDate",
        ti.createdAt,
        ti.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as "staffName",
        s.staff_code as "staffCode"
      FROM time_intervals ti
      LEFT JOIN staffs s ON s.staff_id = ti.staff_id
      ${whereClause}
      ORDER BY ti.record_created_at DESC
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );

    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}
async function getTimeIntervals(query) {
  try {
    // Debug: Check table structure
    const tableInfo = await sequelize.query(
      `SHOW COLUMNS FROM time_intervals`,
      { type: QueryTypes.SELECT }
    );
    
    console.log('Time Intervals table columns:', tableInfo);
    
    let filters = [];
    let replacements = [];
    
    if (query && Object.keys(query).length) {
      if (query.staffId) {
        filters.push(`ti.staff_id = ?`);
        replacements.push(query.staffId);
      }
      
      // Handle date filtering - support both date OR fromDate/toDate
      const hasCreatedAt = tableInfo.some(col => col.Field === 'createdAt');
      const hasRecordCreatedAt = tableInfo.some(col => col.Field === 'record_created_at');
      
      console.log('Date columns found:', { hasCreatedAt, hasRecordCreatedAt });
      
      if (query.date) {
        // Single date mode
        if (hasCreatedAt) {
          // Use createdAt (Sequelize default)
          filters.push(`DATE_FORMAT(ti.createdAt, '%Y-%m-%d') = ?`);
          replacements.push(query.date);
        } else if (hasRecordCreatedAt) {
          // Use record_created_at (your custom timestamp)
          const startDate = new Date(query.date);
          const endDate = new Date(query.date);
          endDate.setDate(endDate.getDate() + 1);
          
          if (hasRecordCreatedAt) {
            filters.push(`ti.record_created_at BETWEEN ? AND ?`);
            replacements.push(startDate.getTime(), endDate.getTime() - 1);
          }
        }
      } else if (query.fromDate && query.toDate) {
        // Date range mode
        const fromDate = new Date(query.fromDate);
        const toDate = new Date(query.toDate);
        toDate.setDate(toDate.getDate() + 1); // Include the entire toDate
        
        if (hasCreatedAt) {
          // Use createdAt (Sequelize default)
          filters.push(`DATE(ti.createdAt) BETWEEN ? AND ?`);
          replacements.push(moment(fromDate).format('YYYY-MM-DD'), moment(toDate).format('YYYY-MM-DD'));
        } else if (hasRecordCreatedAt) {
          // Use record_created_at (your custom timestamp)
          filters.push(`ti.record_created_at BETWEEN ? AND ?`);
          replacements.push(fromDate.getTime(), toDate.getTime() - 1);
        }
      }
      
      if (query.actionType) {
        filters.push(`ti.action_type = ?`);
        replacements.push(query.actionType);
      } else if (query.requestActionType == 1) {
        filters.push(`(ti.action_type = ? OR ti.action_type = ?)`);
        replacements.push('Punch In-Tracker','Punch Out-Tracker');
      } else if (query.requestActionType == 2) {
        filters.push(`(ti.action_type = ? OR ti.action_type = ?)`);
        replacements.push('Visit Out-Tracker', 'Visit In-Tracker');
      }
      
      if (query.attendanceMarkType && query.attendanceMarkType !== 'null') {
        filters.push(`ti.attendance_mark_type = ?`);
        replacements.push(query.attendanceMarkType);
      }
    }
    
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    
    console.log('Final query with date column:', whereClause);
    console.log('Replacements:', replacements);
    
    const result = await sequelize.query(
      `SELECT 
        ti.id,
        ti.staff_id as "staffId",
        ti.time_status as "timeStatus",
        ti.attendance_mark_type as "attendanceMarkType",
        ti.status,
        ti.attendance_type as "attendanceType",
        ti.image_name as "imageName",
        ti.network_status as "networkStatus",
        ti.battery,
        ti.flight_mode as "flightMode",
        ti.address,
        ti.brand,
        ti.manufacturer,
        ti.board,
        ti.device,
        ti.display,
        ti.hardware,
        ti.model,
        ti.product,
        ti.updated_at as "updatedAt",
        ti.latitude,
        ti.longitude,
        ti.coordinates,
        ti.mongo_id as "mongoId",
        ti.action_type as "actionType",
        ti.record_created_at as "recordCreatedAt",
        ti.coordinates_points as "coordinatesPoints",
        ti.work_time as "workTime",
        ti.total_work_time as "totalWorkTime",
        ti.distance,
        ti.speed,
        ti.km_difference as "kmDifference",
        ti.time_travelled as "timeTravelled",
        ti.mobile_status as "mobileStatus",
        ti.image_url as "imageUrl",
        ti.form_detail_id as "formDetailId",
        ti.form_id as "formId",
        ti.client_form as "clientForm",
        ti.branch_visit as "branchVisit",
        ti.centre_no_name as "centreNoName",
        ti.member_name as "memberName",
        ti.collection_amount as "collectionAmount",
        ti.cell_no_name as "cellNoName",
        ti.attachment,
        ti.next_due_date as "nextDueDate",
        ti.createdAt,
        ti.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as "staffName",
        s.staff_code as "staffCode"
      FROM time_intervals ti
      LEFT JOIN staffs s ON s.staff_id = ti.staff_id
      ${whereClause}
      ORDER BY ti.record_created_at DESC`,
      {
        replacements,
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );
    
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function getTimeIntervalDetails(query) {
  try {
    let filters = [];
    if (query && Object.keys(query).length) {
      if (query.id) {
        filters.push(`ti.id = ${query.id}`);
      }
      if (query.staffId) {
        filters.push(`ti.staff_id = ${query.staffId}`);
      }
      if (query.mongoId) {
        filters.push(`ti.mongo_id = '${query.mongoId}'`);
      }
    }

    if (filters.length === 0) {
      throw new Error(messages.INVALID_PARAMETERS);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    const result = await sequelize.query(
      ` 
      SELECT 
        ti.id,
        ti.staff_id as "staffId",
        ti.time_status as "timeStatus",
        ti.attendance_mark_type as "attendanceMarkType",
        ti.status,
        ti.attendance_type as "attendanceType",
        ti.image_name as "imageName",
        ti.network_status as "networkStatus",
        ti.battery,
        ti.flight_mode as "flightMode",
        ti.address,
        ti.brand,
        ti.manufacturer,
        ti.board,
        ti.device,
        ti.display,
        ti.hardware,
        ti.model,
        ti.product,
        ti.updated_at as "updatedAt",
        ti.latitude,
        ti.longitude,
        ti.coordinates,
        ti.mongo_id as "mongoId",
        ti.action_type as "actionType",
        ti.record_created_at as "recordCreatedAt",
        ti.coordinates_points as "coordinatesPoints",
        ti.work_time as "workTime",
        ti.total_work_time as "totalWorkTime",
        ti.distance,
        ti.speed,
        ti.km_difference as "kmDifference",
        ti.time_travelled as "timeTravelled",
        ti.mobile_status as "mobileStatus",
        ti.image_url as "imageUrl",
        ti.form_detail_id as "formDetailId",
        ti.form_id as "formId",
        ti.client_form as "clientForm",
        ti.branch_visit as "branchVisit",
        ti.centre_no_name as "centreNoName",
        ti.member_name as "memberName",
        ti.collection_amount as "collectionAmount",
        ti.cell_no_name as "cellNoName",
        ti.attachment,
        ti.next_due_date as "nextDueDate",
        ti.createdAt,
        ti.updatedAt,
        CONCAT(s.first_name, ' ', s.last_name) as "staffName",
        s.staff_code as "staffCode",
        s.contact_no as "contactNo",
        s.email_id as "emailId"
      FROM time_intervals ti
      LEFT JOIN staffs s ON s.staff_id = ti.staff_id
      ${whereClause}
      LIMIT 1
      `,
      {
        type: QueryTypes.SELECT,
        raw: true,
        nest: false,
      }
    );

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createTimeInterval(postData) {
  const transaction = await sequelize.transaction();
  try {
    // Prepare coordinates points from latitude and longitude if provided
    if (postData.latitude && postData.longitude && !postData.coordinatesPoints) {
      postData.coordinatesPoints = `${postData.latitude},${postData.longitude}`;
    }

    // Prepare coordinates array if not provided
    if (postData.latitude && postData.longitude && !postData.coordinates) {
      postData.coordinates = [parseFloat(postData.longitude), parseFloat(postData.latitude)];
    }

    // Prepare mobile status if not provided
    if (!postData.mobileStatus && postData.battery && postData.networkStatus) {
      postData.mobileStatus = `${postData.battery}%,${postData.networkStatus}`;
    }

    // Set record_created_at to current timestamp if not provided
    if (!postData.recordCreatedAt) {
      postData.recordCreatedAt = Date.now();
    }

    // Set time_status if not provided
    if (!postData.timeStatus) {
      postData.timeStatus = Date.now();
    }

    const executeMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key));

    // Create time interval using Sequelize model
    const result = await sequelize.models.TimeIntervals.create(executeMethod, {
      transaction,
    });

      if (postData.actionType === "Punch In-Tracker" && postData.staffId && postData.attendanceMarkType == "1") {
      try {
        // Get current date in YYYY-MM-DD format
        const attendanceDate = moment().format("YYYY-MM-DD");
        
        // Check if attendance record already exists for this staff on today's date
        const existingAttendance = await sequelize.models.staff_attendance.findOne({
          where: {
            staff_id: postData.staffId,
            attendance_date: attendanceDate
          },
          transaction
        });

        if (!existingAttendance) {
          // Get staff details to fetch branch_id and department_id
          const staffDetails = await sequelize.query(
            `SELECT s.branch_id, s.department_id 
             FROM staffs s 
             WHERE s.staff_id = :staffId AND s.is_active = 1`,
            {
              replacements: { staffId: postData.staffId },
              type: QueryTypes.SELECT,
              transaction
            }
          );

          if (staffDetails && staffDetails.length > 0) {
            const { branch_id, department_id } = staffDetails[0];
            
            // Create attendance record
            await sequelize.models.staff_attendance.create({
              staff_id: postData.staffId,
              attendance_date: attendanceDate,
              branch_id: branch_id,
              department_id: department_id,
              attendance_status_id: 1, // Present
              attendance_incharge_id: postData.staffId // Self-marked
            }, { transaction });
            
            console.log(`Attendance created for staff ${postData.staffId} on ${attendanceDate}`);
          }
        } else {
          await sequelize.models.staff_attendance.update(
    {
      attendance_status_id: 1, // Update to present
      attendance_incharge_id: postData.staffId // Update incharge if needed
    },
    {
      where: {
        staff_attendance_id: existingAttendance.staff_attendance_id
      },
      transaction
    }
  );
          console.log(`Attendance already exists for staff ${postData.staffId} on ${attendanceDate}`);
        }
      } catch (attendanceError) {
        console.error("Error creating attendance record:", attendanceError);
        // Don't throw error here - continue with time interval creation
      }
    } else if (postData.actionType === "Punch Out-Tracker" && postData.staffId && postData.attendanceMarkType == "2") {
      try {
        const attendanceDate = moment().format("YYYY-MM-DD");
        const startOfDay = moment(attendanceDate).startOf('day').valueOf();
        const endOfDay = moment(attendanceDate).endOf('day').valueOf();

        // Find the first Punch In-Tracker on this date using record_created_at (timezone-independent epoch)
        const [punchInRecord] = await sequelize.query(
          `SELECT * FROM time_intervals 
           WHERE staff_id = :staffId 
             AND action_type = 'Punch In-Tracker'
             AND record_created_at BETWEEN :startOfDay AND :endOfDay
           ORDER BY record_created_at ASC
           LIMIT 1`,
          {
            replacements: { staffId: postData.staffId, startOfDay, endOfDay },
            type: QueryTypes.SELECT,
            transaction
          }
        );

        let attendanceStatusId = 0; // Default to Absent if no punch-in is found
        if (punchInRecord) {
          const punchInTime = parseInt(punchInRecord.time_status || punchInRecord.record_created_at);
          const punchOutTime = postData.timeStatus ? parseInt(postData.timeStatus) : Date.now();
          const diffMs = punchOutTime - punchInTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          console.log(`Punch Out calculation: Punch In at ${punchInTime}, Punch Out at ${punchOutTime}. Diff hours: ${diffHours}`);
          
          if (diffHours >= 4) {
            attendanceStatusId = 1; // Full Day
          } else {
            attendanceStatusId = 2; // Half Day
          }
        }

        // Check if attendance record already exists
        const existingAttendance = await sequelize.models.staff_attendance.findOne({
          where: {
            staff_id: postData.staffId,
            attendance_date: attendanceDate
          },
          transaction
        });

        if (!existingAttendance) {
          const staffDetails = await sequelize.query(
            `SELECT s.branch_id, s.department_id 
             FROM staffs s 
             WHERE s.staff_id = :staffId AND s.is_active = 1`,
            {
              replacements: { staffId: postData.staffId },
              type: QueryTypes.SELECT,
              transaction
            }
          );

          if (staffDetails && staffDetails.length > 0) {
            const { branch_id, department_id } = staffDetails[0];
            await sequelize.models.staff_attendance.create({
              staff_id: postData.staffId,
              attendance_date: attendanceDate,
              branch_id: branch_id,
              department_id: department_id,
              attendance_status_id: attendanceStatusId,
              attendance_incharge_id: postData.staffId
            }, { transaction });
            console.log(`Attendance created on Punch Out for staff ${postData.staffId} on ${attendanceDate} with status ${attendanceStatusId}`);
          }
        } else {
          await sequelize.models.staff_attendance.update({
            attendance_status_id: attendanceStatusId,
            attendance_incharge_id: postData.staffId
          }, {
            where: {
              staff_attendance_id: existingAttendance.staff_attendance_id
            },
            transaction
          });
          console.log(`Attendance updated on Punch Out for staff ${postData.staffId} on ${attendanceDate} with status ${attendanceStatusId}`);
        }
      } catch (attendanceError) {
        console.error("Error updating attendance record on Punch Out:", attendanceError);
      }
    }
    
    await transaction.commit();

    // Emit socket event for live location update
    try {
      const { getIO } = require('../socket-manager');
      const io = getIO();
      if (io && postData.latitude && postData.longitude) {
        io.emit('geo:update', {
          staffId: postData.staffId,
          latitude: postData.latitude,
          longitude: postData.longitude,
          speed: postData.speed,
          battery: postData.battery,
          networkStatus: postData.networkStatus,
          actionType: postData.actionType,
          recordCreatedAt: postData.recordCreatedAt || Date.now(),
        });
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError.message);
    }

    // Return created record
    const req = { id: result.id };
    return await getTimeIntervalDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}
async function createTimeInterval2(postData) {
  const transaction = await sequelize.transaction();
  try {
    // Prepare coordinates points from latitude and longitude if provided
    if (postData.latitude && postData.longitude && !postData.coordinatesPoints) {
      postData.coordinatesPoints = `${postData.latitude},${postData.longitude}`;
    }

    // Prepare coordinates array if not provided
    if (postData.latitude && postData.longitude && !postData.coordinates) {
      postData.coordinates = [parseFloat(postData.longitude), parseFloat(postData.latitude)];
    }

    // Prepare mobile status if not provided
    if (!postData.mobileStatus && postData.battery && postData.networkStatus) {
      postData.mobileStatus = `${postData.battery}%,${postData.networkStatus}`;
    }

    // Set record_created_at to current timestamp if not provided
    if (!postData.recordCreatedAt) {
      postData.recordCreatedAt = Date.now();
    }

    // Set time_status if not provided
    if (!postData.timeStatus) {
      postData.timeStatus = Date.now();
    }

    const executeMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key));

    // Create time interval using Sequelize model
    const result = await sequelize.models.TimeIntervals.create(executeMethod, {
      transaction,
    });

    // If action_type is "Punch In-Tracker", create staff attendance record
    if (postData.action_type === "Punch In-Tracker" && postData.staff_id) {
      try {
        // Get current date in YYYY-MM-DD format
        const attendanceDate = moment().format("YYYY-MM-DD");
        
        // Check if attendance record already exists for this staff on today's date
        const existingAttendance = await sequelize.models.staff_attendance.findOne({
          where: {
            staff_id: postData.staff_id,
            attendance_date: attendanceDate
          },
          transaction
        });

        if (!existingAttendance) {
          // Get staff details to fetch branch_id and department_id
          const staffDetails = await sequelize.query(
            `SELECT s.branch_id, s.department_id 
             FROM staffs s 
             WHERE s.staff_id = :staffId AND s.is_active = 1`,
            {
              replacements: { staffId: postData.staff_id },
              type: QueryTypes.SELECT,
              transaction
            }
          );

          if (staffDetails && staffDetails.length > 0) {
            const { branch_id, department_id } = staffDetails[0];
            
            // Create attendance record
            await sequelize.models.staff_attendance.create({
              staff_id: postData.staff_id,
              attendance_date: attendanceDate,
              branch_id: branch_id,
              department_id: department_id,
              attendance_status_id: 1, // Present
              attendance_incharge_id: postData.staff_id // Self-marked
            }, { transaction });
            
            console.log(`Attendance created for staff ${postData.staff_id} on ${attendanceDate}`);
          }
        } else {
          console.log(`Attendance already exists for staff ${postData.staff_id} on ${attendanceDate}`);
        }
      } catch (attendanceError) {
        console.error("Error creating attendance record:", attendanceError);
        // Don't throw error here - continue with time interval creation
      }
    }

    await transaction.commit();

    // Emit socket event for live location update
    try {
      const { getIO } = require('../socket-manager');
      const io = getIO();
      if (io && postData.latitude && postData.longitude) {
        io.emit('geo:update', {
          staffId: postData.staff_id,
          latitude: postData.latitude,
          longitude: postData.longitude,
          speed: postData.speed,
          battery: postData.battery,
          networkStatus: postData.networkStatus,
          actionType: postData.action_type,
          recordCreatedAt: postData.recordCreatedAt || Date.now(),
        });
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError.message);
    }

    // Return created record
    const req = { id: result.id };
    return await getTimeIntervalDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}
async function updateTimeInterval(id, putData) {
  const transaction = await sequelize.transaction();
  try {
    // Prepare coordinates points from latitude and longitude if provided
    if (putData.latitude && putData.longitude && !putData.coordinatesPoints) {
      putData.coordinatesPoints = `${putData.latitude},${putData.longitude}`;
    }

    // Prepare coordinates array if provided
    if (putData.latitude && putData.longitude && !putData.coordinates) {
      putData.coordinates = [parseFloat(putData.longitude), parseFloat(putData.latitude)];
    }

    // Prepare mobile status if battery or network status updated
    if ((putData.battery || putData.networkStatus) && !putData.mobileStatus) {
      const existingRecord = await getTimeIntervalDetails({ id });
      if (existingRecord) {
        const battery = putData.battery || existingRecord.battery;
        const networkStatus = putData.networkStatus || existingRecord.networkStatus;
        putData.mobileStatus = `${battery}%,${networkStatus}`;
      }
    }

    const executeMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key));

    // Update time interval using Sequelize model
    const result = await sequelize.models.TimeIntervals.update(executeMethod, {
      where: { id: id },
      transaction,
    });

    if (result[0] === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }

    await transaction.commit();

    // Return updated record
    const req = { id: id };
    return await getTimeIntervalDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteTimeInterval(id) {
  const transaction = await sequelize.transaction();
  try {
    // Hard delete for time interval data
    const result = await sequelize.models.TimeIntervals.destroy({
      where: { id: id },
      transaction,
    });

    if (result === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }

    await transaction.commit();
    return { message: messages.DELETE_SUCCESS };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function bulkCreateTimeIntervals(timeIntervalsData) {
  const transaction = await sequelize.transaction();
  try {
    const processedData = timeIntervalsData.map((data) => {
      const processed = { ...data };

      // Prepare coordinates points
      if (processed.latitude && processed.longitude && !processed.coordinatesPoints) {
        processed.coordinatesPoints = `${processed.latitude},${processed.longitude}`;
      }

      // Prepare coordinates array
      if (processed.latitude && processed.longitude && !processed.coordinates) {
        processed.coordinates = [parseFloat(processed.longitude), parseFloat(processed.latitude)];
      }

      // Prepare mobile status
      if (!processed.mobileStatus && processed.battery && processed.networkStatus) {
        processed.mobileStatus = `${processed.battery}%,${processed.networkStatus}`;
      }

      // Set timestamps if not provided
      if (!processed.recordCreatedAt) {
        processed.recordCreatedAt = Date.now();
      }
      if (!processed.timeStatus) {
        processed.timeStatus = Date.now();
      }

      return _.mapKeys(processed, (value, key) => _.snakeCase(key));
    });

    const result = await sequelize.models.TimeIntervals.bulkCreate(processedData, {
      transaction,
    });

    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

module.exports = {
  getTimeIntervals,
  updateTimeInterval,
  createTimeInterval,
  getTimeIntervalDetails,
  deleteTimeInterval,
  bulkCreateTimeIntervals,
};