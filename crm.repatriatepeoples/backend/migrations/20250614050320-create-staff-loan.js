'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_loans', {
      staff_loan_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      loan_no: {
        type: Sequelize.STRING
      },
      loan_date: {
        type: Sequelize.DATE
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      interest_rate: {
        type: Sequelize.STRING
      },
      loan_amount: {
        type: Sequelize.STRING
      },
      process_fees: {
        type: Sequelize.STRING
      },
      disbursed_type_id: {
        type: Sequelize.INTEGER
      },
      tenure_period: {
        type: Sequelize.INTEGER
      },
      loan_status_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      bank_id: {
        type: Sequelize.INTEGER
      },
      approved_date: {
        type: Sequelize.DATE
      },
      disbursed_date: {
        type: Sequelize.DATE
      },
      cancelled_date: {
        type: Sequelize.DATE
      },
      approved_by: {
        type: Sequelize.INTEGER
      },
      disbursed_by: {
        type: Sequelize.INTEGER
      },
      cancelled_by: {
        type: Sequelize.INTEGER
      },
      cancelled_reason: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: 1
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staff_loans');
  }
};