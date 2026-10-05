'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('role', [
      {
        role_name: "Super Admin"
      },
      {
        role_name: "Admin"
      },
      {
        role_name: "Employee"
      },
      {
        role_name: "Senior Employee"
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('role', {}, null)
  }
};
