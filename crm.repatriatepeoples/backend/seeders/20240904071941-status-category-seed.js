'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('status_categories', [
      {
        status_category_name: "Gender"
      },
      {
        status_category_name: "Activity"
      },
      {
        status_category_name: "Mode Of Payment"
      },
      {
        status_category_name: "Marital Status"
      },
      {
        status_category_name: "Language"
      },
      {
        status_category_name: "Qualification"
      },
      {
        status_category_name: "Attendance Status"
      },
      {
        status_category_name: "Caste Type"
      },
      {
        status_category_name: "Leave Type"
      },
      {
        status_category_name: "Claim Status"
      },
      {
        status_category_name: "Relation"
      },
      {
        status_category_name: "Permission Type"
      },
      {
        status_category_name: "Surname Type"
      },
      {
        status_category_name: "Time to Join"
      },
      {
        status_category_name: "Achievements At"
      },
      {
        status_category_name: "Achievements Title"
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('status_categories', {}, null)
  }
};
