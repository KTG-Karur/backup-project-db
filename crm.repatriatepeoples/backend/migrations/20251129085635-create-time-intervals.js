"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("time_intervals", {
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
      time_status: {
        type: Sequelize.BIGINT,
      },
      attendance_mark_type: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      attendance_type: {
        type: Sequelize.INTEGER,
      },
      image_name: {
        type: Sequelize.STRING(500), // Limited length for file names
      },
      network_status: {
        type: Sequelize.STRING(50),
      },
      battery: {
        type: Sequelize.STRING(10),
      },
      flight_mode: {
        type: Sequelize.STRING(10),
      },
      address: {
        type: Sequelize.TEXT, // Changed to TEXT for potentially long addresses
      },
      brand: {
        type: Sequelize.STRING(100),
      },
      manufacturer: {
        type: Sequelize.STRING(100),
      },
      board: {
        type: Sequelize.STRING(100),
      },
      device: {
        type: Sequelize.STRING(100),
      },
      display: {
        type: Sequelize.STRING(200),
      },
      hardware: {
        type: Sequelize.STRING(100),
      },
      model: {
        type: Sequelize.STRING(100),
      },
      product: {
        type: Sequelize.STRING(100),
      },
      updated_at: {
        type: Sequelize.BIGINT,
      },
      latitude: {
        type: Sequelize.STRING(50),
      },
      longitude: {
        type: Sequelize.STRING(50),
      },
      coordinates: {
        type: Sequelize.JSON,
      },
      mongo_id: {
        type: Sequelize.STRING(100),
      },
      action_type: {
        type: Sequelize.STRING(100),
      },
      record_created_at: {
        type: Sequelize.BIGINT,
      },
      coordinates_points: {
        type: Sequelize.STRING(100),
      },
      work_time: {
        type: Sequelize.STRING(50),
      },
      total_work_time: {
        type: Sequelize.STRING(50),
      },
      distance: {
        type: Sequelize.STRING(50),
      },
      speed: {
        type: Sequelize.STRING(50),
      },
      km_difference: {
        type: Sequelize.STRING(50),
      },
      time_travelled: {
        type: Sequelize.STRING(50),
      },
      mobile_status: {
        type: Sequelize.STRING(100),
      },
      image_url: {
        type: Sequelize.TEXT, // Changed to TEXT for long URLs
      },
      form_detail_id: {
        type: Sequelize.STRING(100),
      },
      form_id: {
        type: Sequelize.STRING(100),
      },
      client_form: {
        type: Sequelize.STRING(200),
      },
      branch_visit: {
        type: Sequelize.STRING(200),
      },
      centre_no_name: {
        type: Sequelize.STRING(200),
      },
      member_name: {
        type: Sequelize.STRING(200),
      },
      collection_amount: {
        type: Sequelize.STRING(100),
      },
      cell_no_name: {
        type: Sequelize.STRING(200),
      },
      attachment: {
        type: Sequelize.TEXT, // Changed to TEXT for long URLs
      },
      next_due_date: {
        type: Sequelize.STRING(100),
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
    await addIdxSafe("time_intervals", ["staff_id"]);
    await addIdxSafe("time_intervals", ["record_created_at"]);
    await addIdxSafe("time_intervals", ["action_type"]);
    await addIdxSafe("time_intervals", ["mongo_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("time_intervals");
  },
};