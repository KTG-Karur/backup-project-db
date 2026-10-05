'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_attendances', {
      staff_attendance_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      attendance_date: {
        type: Sequelize.DATE
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      branch_id: { type: Sequelize.INTEGER },
      department_id: { type: Sequelize.INTEGER },
      attendance_status_id: {
        type: Sequelize.INTEGER
      },
      attendance_incharge_id: {
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
    await queryInterface.dropTable('staff_attendances');
  }
};