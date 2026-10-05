'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('branches', [
      {
        branch_name: "Karur",
        address: 'Karur bus stand, Karur',
        city: "Karur",
        pincode: "639004",
        email: "karur@gmail.com",
        contact_no: "7896541230",
        is_active: 1,
      },
      {
        branch_name: "Coimbatore",
        address: 'Singanalur bus stand, coimbatore',
        city: "Coimbatore",
        pincode: "639004",
        email: "coimbatore@gmail.com",
        contact_no: "9874563210",
        is_active: 1,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('branches', {}, null)
  }
};
