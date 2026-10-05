'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('setting_deductions', {
      setting_deduction_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      deduction_value: {
        type: Sequelize.STRING
      },
      is_percentage: {
        type: Sequelize.BOOLEAN
      },
      is_deduction: {
        type: Sequelize.BOOLEAN
      },
      is_increment: {
        type: Sequelize.BOOLEAN
      },
      deduction_name: {
        type: Sequelize.STRING
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
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('setting_deductions');
  }
};