"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employee_tracking_reports", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "staffs",
          key: "staff_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tracking_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_distance_km: {
        type: Sequelize.DECIMAL(10, 3),
        defaultValue: 0.000,
      },
      mobile_model: {
        type: Sequelize.STRING,
      },
      battery_level: {
        type: Sequelize.STRING,
      },
      tracking_start_time: {
        type: Sequelize.DATE,
      },
      tracking_end_time: {
        type: Sequelize.DATE,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    await queryInterface.addIndex("employee_tracking_reports", ["staff_id"], {
      name: "idx_etr_staff_id",
    });
    await queryInterface.addIndex(
      "employee_tracking_reports",
      ["tracking_date"],
      { name: "idx_etr_tracking_date" }
    );
    await queryInterface.addIndex(
      "employee_tracking_reports",
      ["employee_name"],
      { name: "idx_etr_employee_name" }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("employee_tracking_reports");
  },
};
