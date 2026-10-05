'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_experiences', {
      work_experience_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      organization_name: {
        type: Sequelize.STRING
      },
      position: {
        type: Sequelize.STRING
      },
      years_of_experience: {
        type: Sequelize.INTEGER
      },
      from_date: {
        type: Sequelize.DATE
      },
      to_date: {
        type: Sequelize.DATE
      },
      gross_pay: {
        type: Sequelize.STRING
      },
      work_location: {
        type: Sequelize.STRING
      },
      reason_for_leaving: {
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
    await queryInterface.dropTable('work_experiences');
  }
};