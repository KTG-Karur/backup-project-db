'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_trainings', {
      staff_training_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staff_id: {
        type: Sequelize.INTEGER
      },
      staff_training_code: {
        type: Sequelize.STRING
      },
      staff_training_date: {
        type: Sequelize.DATE
      },
      from_date: {
        type: Sequelize.DATE
      },
      to_date: {
        type: Sequelize.DATE
      },
      from_place: {
        type: Sequelize.STRING
      },
      to_place: {
        type: Sequelize.STRING
      },
      reason: {
        type: Sequelize.STRING
      },
      staff_training_by: {
        type: Sequelize.INTEGER
      },
      status_id: {
        type: Sequelize.INTEGER,
        defaultValue: 28,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: 1
      },
       createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staff_trainings');
  }
};