"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("setting_benefits", [
      {
        benefit_name:'PF',
        benefit_percentage: "4.7",
      },
      {
        benefit_name:'ESI',
        benefit_percentage: "0.107",
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('setting_benefits', {}, null)
  },
};
