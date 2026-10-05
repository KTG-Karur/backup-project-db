'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      settings_id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      company_name: {
        type: Sequelize.STRING
      },
      company_mobile: {
        type: Sequelize.STRING
      },
      company_alt_mobile: {
        type: Sequelize.STRING
      },
      company_mail: {
        type: Sequelize.STRING
      },
      company_gst_no: {
        type: Sequelize.STRING
      },
      company_address: {
        type: Sequelize.STRING
      },
      company_district: {
        type: Sequelize.STRING
      },
      company_state: {
        type: Sequelize.STRING
      },
      company_pincode: {
        type: Sequelize.STRING
      },
      company_logo: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};