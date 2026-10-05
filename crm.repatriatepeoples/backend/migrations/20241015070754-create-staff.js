'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staffs', {
      staff_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      surname_id: {
        type: Sequelize.INTEGER
      },
      staff_code: {
        type: Sequelize.STRING
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      age: {
        type: Sequelize.INTEGER
      },
      address: {
        type: Sequelize.STRING
      },
      vehicle_no: {
        type: Sequelize.STRING
      },
      caste_type_id: {
        type: Sequelize.INTEGER
      },
      staff_profile_image_name: {
        type: Sequelize.STRING
      },
      expected_salary: {
        type: Sequelize.STRING
      },
      time_to_join_id: {
        type: Sequelize.STRING
      },
      preferred_location_id: {
        type: Sequelize.STRING
      },
      references_by: {
        type: Sequelize.STRING
      },
      other_information: {
        type: Sequelize.STRING
      },
      contact_no: {
        type: Sequelize.STRING
      },
      alternative_contact_no: {
        type: Sequelize.STRING
      },
      email_id: {
        type: Sequelize.STRING
      },
      department_id: {
        type: Sequelize.INTEGER
      },
      designation_id: {
        type: Sequelize.INTEGER
      },
      bank_account_id: {
        type: Sequelize.INTEGER
      },
      branch_id: {
        type: Sequelize.INTEGER
      },
      dob: {
        type: Sequelize.DATE
      },
      date_of_joining: {
        type: Sequelize.DATE
      },
      date_of_reliving: {
        type: Sequelize.DATE
      },
      role_id: {
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      gender_id: {
        type: Sequelize.INTEGER
      },
      martial_status_id: {
        type: Sequelize.INTEGER
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
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staffs');
  }
};