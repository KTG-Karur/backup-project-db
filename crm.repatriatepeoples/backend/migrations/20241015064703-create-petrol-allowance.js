'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('petrol_allowances', {
      petrol_allowance_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      allowance_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      from_place: {
        type: Sequelize.STRING
      },
      to_place: {
        type: Sequelize.STRING
      },
      activity_id: {
        type: Sequelize.STRING
      },
      total_km: {
        type: Sequelize.INTEGER
      },
      bill_image_name: {
        type: Sequelize.STRING
      },
      bill_no: {
        type: Sequelize.STRING
      },
      date_of_purchase: {
        type: Sequelize.DATE
      },
      name_of_dealer: {
        type: Sequelize.STRING
      },
      price_per_litre: {
        type: Sequelize.STRING
      },
      qty_per_litre: {
        type: Sequelize.STRING
      },
      total_amount: {
        type: Sequelize.STRING
      },
      branch_id: {
        type: Sequelize.INTEGER
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
      is_image_approved: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 2
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
    await queryInterface.dropTable('petrol_allowances');
  }
};