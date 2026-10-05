'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transfer_staffs', {
      transfer_staff_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      transfer_code: {
        type: Sequelize.STRING
      },
      joining_date: {
        type: Sequelize.DATE
      },
      relieving_date: {
        type: Sequelize.DATE
      },
      transfer_from: {
        type: Sequelize.STRING
      },
      transfer_to: {
        type: Sequelize.STRING
      },
      transfered_by: {
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
    await queryInterface.dropTable('transfer_staffs');
  }
};