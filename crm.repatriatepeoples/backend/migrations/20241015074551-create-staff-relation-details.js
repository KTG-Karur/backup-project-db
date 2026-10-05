'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_relation_details', {
      staff_relation_details_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      relation_id: {
        type: Sequelize.INTEGER
      },
      relation_name: {
        type: Sequelize.STRING
      },
      contact_no: {
        type: Sequelize.STRING
      },
      relation_dob: {
        type: Sequelize.DATE
      },
      qualification_id: {
        type: Sequelize.INTEGER
      },
      occupation: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('staff_relation_details');
  }
};