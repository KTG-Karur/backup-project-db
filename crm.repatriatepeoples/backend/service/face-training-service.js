"use strict";

const sequelize = require("../models/index").sequelize;
const messages = require("../helpers/message");
const _ = require("lodash");
const { QueryTypes } = require("sequelize");


async function getFaceTrainings(query) {
  let connection;
  try {
    // Test database connection first
    await sequelize.authenticate();
    let filters = [];
    let replacements = [];

    // Base query to get all staff with face training status
    const baseQuery = `
      SELECT
        s.staff_id as "staffId",
        s.staff_code as "staffCode",
        s.staff_profile_image_name as "staff_image",
        CONCAT(s.first_name, ' ', s.last_name) as "name",
        s.contact_no as "contactNo",
        s.email_id as "emailId",
        s.department_id as "departmentId",
        s.designation_id as "designationId",
        s.role_id as "roleId",
        s.user_id as "userId",
        s.is_active as "isActive",
        s.branch_id as "branchId",
        b.branch_name as "branchName",

        s.createdAt as "staffCreatedAt",
        s.updatedAt as "staffUpdatedAt",
        -- Face training fields (if exists)
        ft.id as "faceTrainingId",
        ft.images,
        ft.status_label as "statusLabel",
        ft.color,
        ft.text_color as "textColor",
        ft.chip_color as "chipColor",
        ft.designation as "trainingDesignation",
        ft.train_status as "trainStatus",
        ft.model_version as "modelVersion",
        ft.trained_at as "trainedAt",
        ft.training_attempts as "trainingAttempts",
        ft.last_training_error as "lastTrainingError",
        ft.metadata,
        ft.created_by as "createdBy",
        ft.updated_by as "updatedBy",
        ft.createdAt as "faceTrainingCreatedAt",
        ft.updatedAt as "faceTrainingUpdatedAt",
        -- Trainer name: look up staff whose user_id matches ft.created_by
        CONCAT(trainer.first_name, ' ', trainer.last_name) as "trainedByName",
        -- Status info object
        CASE 
          WHEN ft.id IS NOT NULL THEN 
            JSON_OBJECT(
              'statusLabel', COALESCE(ft.status_label, 'Pending'),
              'color', COALESCE(ft.color, '0xFFFEF3C7'),
              'textColor', COALESCE(ft.text_color, '0xFF92400E'),
              'chipColor', COALESCE(ft.chip_color, '0xFFFBBF24')
            )
          ELSE 
            JSON_OBJECT(
              'statusLabel', 'Not Trained',
              'color', '0xFFFEF3C7',
              'textColor', '0xFF92400E',
              'chipColor', '0xFFFBBF24'
            )
        END as "statusInfo",
        -- Training status flag
        CASE 
          WHEN ft.id IS NOT NULL THEN 
            CASE 
              WHEN ft.train_status = TRUE THEN 'Face Trained'
              ELSE 'Training Pending'
            END
          ELSE 'Face Not Trained'
        END as "trainingStatus"
    `;

    // Check if we need to filter specific staff
    if (query && Object.keys(query).length) {
      // Always show active staff by default
      if (query.isActive === undefined) {
        filters.push(`s.is_active = 1`);
      }

      if (query.staffId) {
        filters.push(`s.staff_id = ?`);
        replacements.push(query.staffId);
      }

      if (query.staffCode) {
        filters.push(`s.staff_code LIKE ?`);
        replacements.push(`%${query.staffCode}%`);
      }

      if (query.name) {
        filters.push(`CONCAT(s.first_name, ' ', s.last_name) LIKE ?`);
        replacements.push(`%${query.name}%`);
      }

      if (query.designationId) {
        filters.push(`s.designation_id = ?`);
        replacements.push(query.designationId);
      }

      if (query.trainStatus !== undefined) {
        if (query.trainStatus === "true") {
          filters.push(`ft.train_status = TRUE`);
        } else if (query.trainStatus === "false") {
          filters.push(`(ft.id IS NULL OR ft.train_status = FALSE)`);
        }
      }

      if (query.statusLabel) {
        if (query.statusLabel === "Not Trained") {
          filters.push(`ft.id IS NULL`);
        } else {
          filters.push(`COALESCE(ft.status_label, 'Not Trained') = ?`);
          replacements.push(query.statusLabel);
        }
      }

      if (query.trainingStatus) {
        if (query.trainingStatus === "Face Trained") {
          filters.push(`ft.id IS NOT NULL AND ft.train_status = TRUE`);
        } else if (query.trainingStatus === "Training Pending") {
          filters.push(`ft.id IS NOT NULL AND ft.train_status = FALSE`);
        } else if (query.trainingStatus === "Face Not Trained") {
          filters.push(`ft.id IS NULL`);
        }
      }

      if (query.isActive !== undefined) {
        filters.push(`s.is_active = ?`);
        replacements.push(query.isActive === "true" ? 1 : 0);
      }

      if (query.startDate && query.endDate) {
        filters.push(`(s.createdAt BETWEEN ? AND ?)`);
        replacements.push(query.startDate, query.endDate);
      }

      if (query.lastTrainedAfter) {
        filters.push(`ft.trained_at > ?`);
        replacements.push(query.lastTrainedAfter);
      }

      if (query.departmentId) {
        filters.push(`s.department_id = ?`);
        replacements.push(query.departmentId);
      }

      if (query.roleId) {
        filters.push(`s.role_id = ?`);
        replacements.push(query.roleId);
      }

      if (query.branchId) {
        filters.push(`FIND_IN_SET(?, s.branch_id) > 0`);
        replacements.push(query.branchId);
      }
    } else {
      // Default filter: show only active staff
      filters.push(`s.is_active = 1`);
    }

    // Build WHERE clause
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    // Build the final query
    const finalQuery = `
      ${baseQuery}
      FROM staffs s
      LEFT JOIN face_trainings ft ON s.staff_id = ft.staff_id
      LEFT JOIN branches b ON b.branch_id = s.branch_id
      LEFT JOIN staffs trainer ON trainer.user_id = ft.created_by
      ${whereClause}
    `;

    // Count queries for statistics
    const statsQuery = `
      SELECT
        COUNT(DISTINCT s.staff_id) as total_emp,
        COUNT(DISTINCT CASE WHEN ft.id IS NOT NULL AND ft.train_status = TRUE THEN s.staff_id END) as number_of_face_trained,
        COUNT(DISTINCT CASE WHEN ft.id IS NULL THEN s.staff_id END) as number_of_face_not_trained,
        COUNT(DISTINCT CASE WHEN ft.id IS NOT NULL AND ft.train_status = FALSE THEN s.staff_id END) as number_of_training_pending
      FROM staffs s
      LEFT JOIN face_trainings ft ON s.staff_id = ft.staff_id
      LEFT JOIN branches b ON b.branch_id = s.branch_id
      LEFT JOIN staffs trainer ON trainer.user_id = ft.created_by
      ${whereClause}
    `;

    // Get statistics
    const statsResult = await sequelize.query(statsQuery, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true,
    });

    const stats = statsResult[0] || {
      total_emp: 0,
      number_of_face_trained: 0,
      number_of_face_not_trained: 0,
      number_of_training_pending: 0
    };

    // Get total count for pagination (same as total_emp)
    const total = parseInt(stats.total_emp) || 0;
    const limit = query?.limit ? parseInt(query.limit) : 100;
    const offset = query?.offset ? parseInt(query.offset) : 0;

    // Add ordering and pagination
    const orderBy = query?.sortBy || "s.staff_id";
    const orderDir = query?.sortDir === "desc" ? "DESC" : "ASC";
    const paginatedQuery = `
      ${finalQuery}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    const result = await sequelize.query(paginatedQuery, {
      replacements: [...replacements, limit, offset],
      type: QueryTypes.SELECT,
      raw: true,
      nest: false,
    });

    // Format the response
    const formattedResult = result.map(staff => {
      const hasFaceTraining = staff.faceTrainingId !== null;

      // Parse JSON if it's a string (for MySQL)
      let statusInfo;
      try {
        statusInfo = typeof staff.statusInfo === 'string' 
          ? JSON.parse(staff.statusInfo) 
          : staff.statusInfo;
      } catch (e) {
        statusInfo = {
          statusLabel: hasFaceTraining ? 'Pending' : 'Not Trained',
          color: '0xFFFEF3C7',
          textColor: '0xFF92400E',
          chipColor: '0xFFFBBF24'
        };
      }

      return {
        staffId: staff.staffId,
        staffCode: staff.staffCode,
        staff_image: staff.staff_image,
        name: staff.name,
        contactNo: staff.contactNo,
        emailId: staff.emailId,
        departmentId: staff.departmentId,
        designationId: staff.designationId,
        roleId: staff.roleId,
        userId: staff.userId,
        branchId: staff.branchId,
        branchName: staff.branchName || null,
        isActive: staff.isActive === 1,
        trainingStatus: staff.trainingStatus || 'Face Not Trained',
        statusInfo: statusInfo,
        faceTraining: hasFaceTraining ? {
          id: staff.faceTrainingId,
          images: staff.images || [],
          designation: staff.trainingDesignation,
          trainStatus: staff.trainStatus === 1,
          modelVersion: staff.modelVersion,
          trainedAt: staff.trainedAt,
          trainingAttempts: staff.trainingAttempts || 0,
          lastTrainingError: staff.lastTrainingError,
          metadata: staff.metadata,
          trainedBy: staff.trainedByName || null,
          createdBy: staff.createdBy,
          updatedBy: staff.updatedBy,
          createdAt: staff.faceTrainingCreatedAt,
          updatedAt: staff.faceTrainingUpdatedAt
        } : null,
        staffCreatedAt: staff.staffCreatedAt,
        staffUpdatedAt: staff.staffUpdatedAt
      };
    });

    return {
      data: formattedResult,
      count: {
        total_emp: parseInt(stats.total_emp) || 0,
        number_of_face_trained: parseInt(stats.number_of_face_trained) || 0,
        number_of_face_not_trained: parseInt(stats.number_of_face_not_trained) || 0,
        number_of_training_pending: parseInt(stats.number_of_training_pending) || 0,
        // Calculate percentage
        face_trained_percentage: stats.total_emp > 0 
          ? Math.round((parseInt(stats.number_of_face_trained) / parseInt(stats.total_emp)) * 100)
          : 0,
        face_not_trained_percentage: stats.total_emp > 0
          ? Math.round((parseInt(stats.number_of_face_not_trained) / parseInt(stats.total_emp)) * 100)
          : 0,
        training_pending_percentage: stats.total_emp > 0
          ? Math.round((parseInt(stats.number_of_training_pending) / parseInt(stats.total_emp)) * 100)
          : 0
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + formattedResult.length < total,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      },
    };
  } catch (error) {
    console.error('Database error in getFaceTrainings:', error.message);
    
    // Check if it's a connection error
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Database connection failed. Please check if the database server is running.');
    }
    
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}


async function getFaceTrainingDetails(query) {
  try {
    let filters = [];

    if (query && Object.keys(query).length) {
      if (query.id) {
        filters.push(`ft.id = ${query.id}`);
      }

      if (query.staffId) {
        filters.push(`ft.staff_id = ${query.staffId}`);
      }

      if (query.staffCode) {
        filters.push(`ft.staff_code = '${query.staffCode}'`);
      }
    }

    if (filters.length === 0) {
      throw new Error(messages.INVALID_PARAMETERS);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    const result = await sequelize.query(
      `
      SELECT
        ft.id,
        ft.staff_id as "staffId",
        ft.staff_code as "staffCode",
        ft.name,
        ft.images,
        JSON_OBJECT(
          'statusLabel', ft.status_label,
          'color', ft.color,
          'textColor', ft.text_color,
          'chipColor', ft.chip_color
        ) as "statusInfo",
        ft.designation,
        ft.train_status as "trainStatus",
        ft.model_version as "modelVersion",
        ft.trained_at as "trainedAt",
        ft.training_attempts as "trainingAttempts",
        ft.last_training_error as "lastTrainingError",
        ft.metadata,
        ft.created_by as "createdBy",
        ft.updated_by as "updatedBy",
        ft.createdAt,
        ft.updatedAt,
        s.first_name as "firstName",
        s.last_name as "lastName",
        s.contact_no as "contactNo",
        s.email_id as "emailId",
        s.department_id as "departmentId",
        s.designation_id as "designationId",
        s.role_id as "roleId",
        s.user_id as "userId",
        s.is_active as "isActive"
      FROM face_trainings ft
      LEFT JOIN staffs s ON s.staff_id = ft.staff_id
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

async function createFaceTraining(postData) {
  const transaction = await sequelize.transaction();
  try {
    // Validate required fields
    if (!postData.staffId || !postData.staffCode || !postData.name) {
      throw new Error("staffId, staffCode, and name are required");
    }

    // Check if staff exists
    const staffExists = await sequelize.models.staff.findOne({
      where: { staff_id: postData.staffId },
      transaction,
    });

    if (!staffExists) {
      throw new Error("Staff not found with the provided staffId");
    }

    // Prepare the data
    const processedData = {
      ...postData,
      images: postData.images || [],
      train_status: postData.trainStatus || false,
    };

    // Check if face training already exists for this staff
    const existingRecord = await sequelize.models.FaceTraining.findOne({
      where: { staff_id: postData.staffId },
      transaction,
    });

    if (existingRecord) {
      throw new Error("Face training record already exists for this staff member");
    }

    const executeMethod = _.mapKeys(processedData, (value, key) =>
      _.snakeCase(key)
    );

    // Create face training record
    const result = await sequelize.models.FaceTraining.create(executeMethod, {
      transaction,
    });

    await transaction.commit();

    // Return created record
    const req = { id: result.id };
    return await getFaceTrainingDetails(req);
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateFaceTraining(id, putData) {
  const transaction = await sequelize.transaction();
  try {
    // Check if record exists
    const existingRecord = await getFaceTrainingDetails({ id });
    if (!existingRecord) {
      throw new Error(messages.DATA_NOT_FOUND);
    }

    // Update images if provided
    if (putData.images && Array.isArray(putData.images)) {
      putData.images = [ ...putData.images];
    }

    const executeMethod = _.mapKeys(putData, (value, key) =>
      _.snakeCase(key)
    );

    // Update face training record
    const result = await sequelize.models.FaceTraining.update(executeMethod, {
      where: { id: id },
      transaction,
    });

    if (result[0] === 0) {
      throw new Error(messages.DATA_NOT_FOUND);
    }

    // If training failed, increment attempts and store error
    if (putData.trainStatus === false && putData.lastTrainingError) {
      await sequelize.models.FaceTraining.increment("training_attempts", {
        by: 1,
        where: { id: id },
        transaction,
      });
    }

    await transaction.commit();

    // Return updated record
    return await getFaceTrainingDetails({ id });
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function deleteFaceTraining(id) {
  const transaction = await sequelize.transaction();
  try {
    const result = await sequelize.models.FaceTraining.destroy({
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

async function bulkCreateFaceTrainings(faceTrainingsData) {
  const transaction = await sequelize.transaction();
  try {
    if (!Array.isArray(faceTrainingsData)) {
      throw new Error("Request body must be an array");
    }

    const processedData = faceTrainingsData.map((data) => {
      // Validate required fields
      if (!data.staffId || !data.staffCode || !data.name) {
        throw new Error(
          "Each item must have staffId, staffCode, and name"
        );
      }

      const processed = {
        ...data,
        images: data.images || [],
        train_status: data.trainStatus || false,
      };

      return _.mapKeys(processed, (value, key) => _.snakeCase(key));
    });

    // Check for duplicate staff_ids
    const staffIds = processedData.map((item) => item.staff_id);
    const existingRecords = await sequelize.models.FaceTraining.findAll({
      where: { staff_id: staffIds },
      attributes: ["staff_id"],
      transaction,
    });

    if (existingRecords.length > 0) {
      const existingIds = existingRecords.map((record) => record.staff_id);
      throw new Error(
        `Face training records already exist for staff IDs: ${existingIds.join(
          ", "
        )}`
      );
    }

    const result = await sequelize.models.FaceTraining.bulkCreate(
      processedData,
      {
        transaction,
        validate: true,
      }
    );

    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function retrainFaceModel(staffId) {
  const transaction = await sequelize.transaction();
  try {
    const record = await getFaceTrainingDetails({ staffId });
    if (!record) {
      throw new Error("Face training record not found");
    }

    // Reset training status and increment attempts
    const updateData = {
      trainStatus: false,
      statusLabel: "Retraining",
      trainingAttempts: record.trainingAttempts + 1,
      lastTrainingError: null,
    };

    await updateFaceTraining(record.id, updateData);

    // TODO: Integrate with actual face recognition service
    // const trainingResult = await faceRecognitionService.train(record.images);
    
    // Simulate training process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Update with success (simulated)
    const successUpdate = {
      trainStatus: true,
      modelVersion: "v2.1.0",
      trainedAt: Date.now(),
    };

    const result = await updateFaceTraining(record.id, successUpdate);
    
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    
    // Store the error
    const record = await getFaceTrainingDetails({ staffId });
    if (record) {
      await updateFaceTraining(record.id, {
        lastTrainingError: error.message,
      });
    }
    
    throw error;
  }
}

module.exports = {
  getFaceTrainings,
  getFaceTrainingDetails,
  createFaceTraining,
  updateFaceTraining,
  deleteFaceTraining,
  bulkCreateFaceTrainings,
  retrainFaceModel,
};