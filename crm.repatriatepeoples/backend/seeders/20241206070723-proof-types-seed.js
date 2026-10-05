'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('proof_types', [
      {
        proof_type_name: "Aadhar Number"
      },
      {
        proof_type_name: "Pan Number"
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('proof_types', {}, null)
  }
};
