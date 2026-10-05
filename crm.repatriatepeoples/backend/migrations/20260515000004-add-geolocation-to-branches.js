'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('branches');
    if (!cols.latitude) {
      await queryInterface.addColumn('branches', 'latitude', {
        type: Sequelize.DECIMAL(11, 7),
        allowNull: true,
      });
    }
    if (!cols.longitude) {
      await queryInterface.addColumn('branches', 'longitude', {
        type: Sequelize.DECIMAL(11, 7),
        allowNull: true,
      });
    }
    if (!cols.allowed_radius) {
      await queryInterface.addColumn('branches', 'allowed_radius', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 100,
        comment: 'Geofence radius in metres',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('branches', 'latitude');
    await queryInterface.removeColumn('branches', 'longitude');
    await queryInterface.removeColumn('branches', 'allowed_radius');
  }
};
