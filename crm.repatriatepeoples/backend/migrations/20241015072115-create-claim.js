'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('claims', {
      claim_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      claim_type_id: {
        type: Sequelize.INTEGER
      },
      approved_by: {
        type: Sequelize.INTEGER
      },
      requested_by: {
        type: Sequelize.INTEGER
      },
      requested_amount: {
        type: Sequelize.STRING
      },
      reason: {
        type: Sequelize.STRING
      },
      branch_id: {
        type: Sequelize.INTEGER
      },
      recepit_image_name: {
        type: Sequelize.STRING
      },
      claim_amount: {
        type: Sequelize.STRING
      },
      apply_date: {
        type: Sequelize.DATE
      },
      mode_of_payment_id: {
        type: Sequelize.INTEGER
      },
      approved_date: {
        type: Sequelize.DATE
      },
      purchase_date: {
        type: Sequelize.DATE
      },
      bank_account_id: {
        allowNull: true,
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
    await queryInterface.dropTable('claims');
  }
};