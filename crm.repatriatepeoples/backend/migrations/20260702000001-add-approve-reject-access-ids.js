 'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE pages SET access_ids = '1,2,3,6,7' WHERE page_url = '/staff/staff-leave'`
    );
    await queryInterface.sequelize.query(
      `UPDATE pages SET access_ids = '1,2,3,6,7' WHERE page_url = '/claim/claim-list'`
    );
    await queryInterface.sequelize.query(
      `UPDATE pages SET access_ids = '1,2,3,6,7,8' WHERE page_url = '/allowance/petrol-allowance'`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE pages SET access_ids = '1,2,3' WHERE page_url = '/staff/staff-leave'`
    );
    await queryInterface.sequelize.query(
      `UPDATE pages SET access_ids = '1,2,3' WHERE page_url = '/claim/claim-list'`
    );
    await queryInterface.sequelize.query(
      `UPDATE pages SET access_ids = '1,2,3,8' WHERE page_url = '/allowance/petrol-allowance'`
    );
  }
};
