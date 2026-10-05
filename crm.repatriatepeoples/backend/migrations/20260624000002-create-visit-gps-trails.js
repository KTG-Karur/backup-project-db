'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('visit_gps_trails', {
      gps_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      entry_log_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'branch_location_entry_logs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'staffs', key: 'staff_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      latitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      recorded_at: {
        type: Sequelize.DATE,
      },
      battery_level: {
        type: Sequelize.STRING,
      },
      speed_kmph: {
        type: Sequelize.DECIMAL(6, 2),
      },
      accuracy_meters: {
        type: Sequelize.DECIMAL(6, 2),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('visit_gps_trails', ['entry_log_id'], {
      name: 'idx_vgt_entry_log_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('visit_gps_trails');
  },
};
