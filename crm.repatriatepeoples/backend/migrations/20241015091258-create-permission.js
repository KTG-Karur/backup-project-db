'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      permission_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      permission_type_id: {
        type: Sequelize.INTEGER
      },
      permission_date: {
        type: Sequelize.DATE
      },
      spoken_date: {
        type: Sequelize.DATE
      },
      spoken_time: {
        type: Sequelize.STRING
      },
      spoken_staff_id: {
        type: Sequelize.STRING
      },
      reason: {
        type: Sequelize.STRING
      },
      approved_by: {
        type: Sequelize.INTEGER
      },
      branch_id: {
        type: Sequelize.INTEGER,
      },
      status_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 28
      },
      is_active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: 1
      },
       createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permissions');
  }
};