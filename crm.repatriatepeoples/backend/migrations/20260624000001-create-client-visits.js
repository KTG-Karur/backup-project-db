'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client_visits', {
      client_visit_id: {
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
      visit_sequence: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      client_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      client_code: {
        type: Sequelize.STRING,
      },
      contact_person: {
        type: Sequelize.STRING,
      },
      contact_no: {
        type: Sequelize.STRING,
      },
      visit_category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reached_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reached_latitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      reached_longitude: {
        type: Sequelize.DECIMAL(11, 7),
      },
      departed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      form_data: {
        type: Sequelize.JSON,
      },
      photo_url: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
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

    await queryInterface.addIndex('client_visits', ['entry_log_id'], {
      name: 'idx_cv_entry_log_id',
    });
    await queryInterface.addIndex('client_visits', ['staff_id'], {
      name: 'idx_cv_staff_id',
    });
    await queryInterface.addIndex('client_visits', ['visit_category'], {
      name: 'idx_cv_visit_category',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('client_visits');
  },
};
