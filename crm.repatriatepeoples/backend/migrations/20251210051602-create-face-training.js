"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("face_trainings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "staffs",
          key: "staff_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      staff_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      images: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        comment: "Array of image URLs for face training",
      },
      status_label: {
        type: Sequelize.STRING(50),
        defaultValue: "Pending",
      },
      color: {
        type: Sequelize.STRING(20),
        comment: "Background color in hex format (0xFFDEF9DB)",
      },
      text_color: {
        type: Sequelize.STRING(20),
        comment: "Text color in hex format (0xFF29A01B)",
      },
      chip_color: {
        type: Sequelize.STRING(20),
        comment: "Chip color in hex format (0xFFA1E999)",
      },
      designation: {
        type: Sequelize.STRING(200),
      },
      train_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      model_version: {
        type: Sequelize.STRING(50),
        comment: "Version of the face recognition model used",
      },
      trained_at: {
        type: Sequelize.BIGINT,
        comment: "Timestamp when training was completed",
      },
      training_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_training_error: {
        type: Sequelize.TEXT,
        comment: "Last error message if training failed",
      },
      metadata: {
        type: Sequelize.JSON,
        comment: "Additional metadata for face training",
      },
      created_by: {
        type: Sequelize.INTEGER,
        comment: "User ID who created the training record",
      },
      updated_by: {
        type: Sequelize.INTEGER,
        comment: "User ID who last updated the training record",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes for better performance (skip if already exist on pre-existing table)
    const addIdxSafe = async (table, fields) => {
      try { await queryInterface.addIndex(table, fields); } catch (_) {}
    };
    await addIdxSafe("face_trainings", ["staff_id"]);
    await addIdxSafe("face_trainings", ["staff_code"]);
    await addIdxSafe("face_trainings", ["train_status"]);
    await addIdxSafe("face_trainings", ["status_label"]);
    await addIdxSafe("face_trainings", ["trained_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("face_trainings");
  },
};