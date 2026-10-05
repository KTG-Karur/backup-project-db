'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('department',[
      {
        department_name : "Office Staff"
      },
      {
        department_name : "Accountant"
      },
      {
        department_name : "Collection Staff"
      },
     ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('department', {}, null)
  }
};
