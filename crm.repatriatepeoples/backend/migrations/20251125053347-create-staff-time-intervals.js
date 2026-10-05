"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("staff_time_intervals", {
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

      timeStatus: { type: Sequelize.BIGINT },
      attendanceMarkType: { type: Sequelize.INTEGER },
      attendanceType: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER },

      address: { type: Sequelize.STRING },
      latitude: { type: Sequelize.STRING },
      longitude: { type: Sequelize.STRING },
      coordinatesPoints: { type: Sequelize.STRING },

      networkStatus: { type: Sequelize.STRING },
      battery: { type: Sequelize.STRING },
      flightMode: { type: Sequelize.STRING },

      actionType: { type: Sequelize.STRING },
      workTime: { type: Sequelize.STRING },
      totalWorkTime: { type: Sequelize.STRING },

      imageName: { type: Sequelize.STRING },
      imageUrl: { type: Sequelize.STRING },

      record_createdAt: { type: Sequelize.BIGINT },

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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("staff_time_intervals");
  },
};
