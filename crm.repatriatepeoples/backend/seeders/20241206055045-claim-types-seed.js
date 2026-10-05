'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('claim_types', [
      {
        claim_type_name: "Birthday Claim",
        eligible_amount:750,
      },
      {
        claim_type_name: "Travel Expenses",
        eligible_amount:1120,
      },
      {
        claim_type_name: "Medical Expenses",
        eligible_amount:800,
      },
      {
        claim_type_name: "Miscellaneous",
        eligible_amount:200,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('claim_types', {}, null)
  }
};
