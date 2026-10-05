'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_advances', {
      staff_advance_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      apply_date: {
        type: Sequelize.DATE
      },
      approved_date: {
        type: Sequelize.DATE
      },
      approved_by: {
        type: Sequelize.INTEGER
      },
      amount: {
        type: Sequelize.STRING
      },
      reason: {
        type: Sequelize.STRING
      },
      paid_amount: {
        type: Sequelize.STRING
      },
      balance_amount: {
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
    await queryInterface.dropTable('staff_advances');
  }
};