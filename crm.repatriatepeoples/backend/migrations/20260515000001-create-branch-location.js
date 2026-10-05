"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("branch_locations", {
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
      employee_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "branches",
          key: "branch_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      branch_name: {
        type: Sequelize.STRING,
      },
      registered_latitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      registered_longitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      live_latitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      live_longitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      role: {
        type: Sequelize.STRING,
      },
      office_entry_time: {
        type: Sequelize.TIME,
      },
      tracking_status: {
        type: Sequelize.STRING,
        defaultValue: "active",
      },
      notification_status: {
        type: Sequelize.STRING,
        defaultValue: "not_sent",
      },
      arrival_time: {
        type: Sequelize.DATE,
      },
      fcm_token: {
        type: Sequelize.TEXT,
      },
      location_radius: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
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

    await queryInterface.addIndex("branch_locations", ["staff_id"], {
      name: "idx_bl_staff_id",
    });
    await queryInterface.addIndex("branch_locations", ["branch_id"], {
      name: "idx_bl_branch_id",
    });
    await queryInterface.addIndex("branch_locations", ["tracking_status"], {
      name: "idx_bl_tracking_status",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("branch_locations");
  },
};
