'use strict';

const department = require('../models/department');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('designation',[
      {
        designation_name : "Manager",
        department_id : 1
      },
      {
        designation_name : "Developer",
        department_id : 1
      },
      {
        designation_name : "Designer",
        department_id : 1
      },
      {
        designation_name : "Digital Marketing",
        department_id : 1
      },
     ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('designation', {}, null)
  }
};
