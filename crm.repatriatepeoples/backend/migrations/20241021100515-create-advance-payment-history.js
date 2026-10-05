'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('advance_payment_histories', {
      advance_payment_history_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_advance_id: {
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER
      },
      through_id: {
        type: Sequelize.INTEGER
      },
      paid_amount: {
        type: Sequelize.STRING
      },
      balance_amount: {
        type: Sequelize.STRING
      },
      paid_date: {
        type: Sequelize.DATE
      },
      paid_to: {
        type: Sequelize.INTEGER
      },
      description: {
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
    await queryInterface.dropTable('advance_payment_histories');
  }
};