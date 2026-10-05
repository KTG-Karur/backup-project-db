"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("staff_geolocations", {
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

      type: { type: Sequelize.STRING }, // always "Point"

      latitude: { type: Sequelize.STRING },
      longitude: { type: Sequelize.STRING },

      attendanceMarkType: { type: Sequelize.INTEGER },
      attendanceType: { type: Sequelize.INTEGER },
      actionType: { type: Sequelize.STRING },

      battery: { type: Sequelize.STRING },
      networkStatus: { type: Sequelize.STRING },
      flightMode: { type: Sequelize.STRING },

      speed: { type: Sequelize.STRING },
      distance: { type: Sequelize.STRING },
      kmDifference: { type: Sequelize.STRING },
      totalDistance: { type: Sequelize.STRING },

      coordinatesPoints: { type: Sequelize.STRING },
      imageName: { type: Sequelize.STRING },
      imageUrl: { type: Sequelize.STRING },

        status: { type: Sequelize.STRING },
      permissionStatus: { type: Sequelize.STRING },
      

      record_createdAt: { type: Sequelize.BIGINT }, // from API createdAt

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
    await queryInterface.dropTable("staff_geolocations");
  },
};
