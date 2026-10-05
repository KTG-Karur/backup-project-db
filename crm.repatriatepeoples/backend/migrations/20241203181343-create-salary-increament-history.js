'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('salary_increament_histories', {
      salary_increament_history_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      salary_amount: {
        type: Sequelize.STRING
      },
      esi_amount: {
        type: Sequelize.STRING
      },
      pf_amount: {
        type: Sequelize.STRING
      },
      annual_amount: {
        type: Sequelize.STRING
      },
      increament_date: {
        type: Sequelize.DATE
      },
      increament_by: {
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
    await queryInterface.dropTable('salary_increament_histories');
  }
};