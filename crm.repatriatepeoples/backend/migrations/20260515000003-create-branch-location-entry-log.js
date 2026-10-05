"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("branch_location_entry_logs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      branch_location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "branch_locations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      office_name: {
        type: Sequelize.STRING,
      },
      entry_time: {
        type: Sequelize.DATE,
      },
      entry_date: {
        type: Sequelize.DATEONLY,
      },
      distance_metres: {
        type: Sequelize.DECIMAL(10, 2),
      },
      mobile_model: {
        type: Sequelize.STRING,
      },
      battery_level: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "Location Reached",
      },
      notification_status: {
        type: Sequelize.STRING,
        defaultValue: "not_sent",
      },
      notification_sent_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("branch_location_entry_logs", ["staff_id"], {
      name: "idx_blel_staff_id",
    });
    await queryInterface.addIndex(
      "branch_location_entry_logs",
      ["entry_date"],
      { name: "idx_blel_entry_date" }
    );
    await queryInterface.addIndex(
      "branch_location_entry_logs",
      ["branch_location_id"],
      { name: "idx_blel_branch_location_id" }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("branch_location_entry_logs");
  },
};
