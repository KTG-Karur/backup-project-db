'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('branch_location_entry_logs');
    if (!tableInfo.visit_out_time) {
      await queryInterface.addColumn('branch_location_entry_logs', 'visit_out_time', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!tableInfo.travel_start_time) {
      await queryInterface.addColumn('branch_location_entry_logs', 'travel_start_time', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('branch_location_entry_logs', 'travel_start_time');
  },
};
