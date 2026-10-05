'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_leaves', {
      staff_leave_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      leave_type_id: {
        type: Sequelize.INTEGER
      },
      day_count: {
        type: Sequelize.INTEGER
      },
      reason: {
        type: Sequelize.STRING
      },
      from_date: {
        type: Sequelize.DATE
      },
      to_date: {
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
      branch_id: {
        type: Sequelize.INTEGER,
      },
      status_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 28
      },
      approved_by: {
        type: Sequelize.INTEGER
      },
       createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE
      }

    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staff_leaves');
  }
};