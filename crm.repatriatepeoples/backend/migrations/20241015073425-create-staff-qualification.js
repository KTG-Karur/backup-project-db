'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_qualifications', {
      staff_qualification_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      qualification_id: {
        type: Sequelize.INTEGER
      },
      passing_year: {
        type: Sequelize.STRING
      },
      university_name: {
        type: Sequelize.STRING
      },
      percentage: {
        type: Sequelize.STRING
      },
      stream: {
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
    await queryInterface.dropTable('staff_qualifications');
  }
};