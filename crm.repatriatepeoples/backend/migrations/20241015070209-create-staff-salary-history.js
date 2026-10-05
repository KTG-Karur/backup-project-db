'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_salary_histories', {
      staff_salary_history_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      salary_date: {
        type: Sequelize.DATE
      },
      salaried_month: {
        type: Sequelize.STRING
      },
      attendance_based_salary: {
        type: Sequelize.TEXT
      },
      deduction_details: {
        type: Sequelize.TEXT
      },
      attendance_list: {
        type: Sequelize.TEXT
      },
      salary_details: {
        type: Sequelize.TEXT
      },
      esi_amount: {
        type: Sequelize.STRING,
        defaultValue: '0'
      },
      pf_amount: {
        type: Sequelize.STRING,
        defaultValue: '0'
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
    await queryInterface.dropTable('staff_salary_histories');
  }
};