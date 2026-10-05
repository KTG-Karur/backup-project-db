'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('staff_salary_histories');
    if (!cols.esi_amount) {
      await queryInterface.addColumn('staff_salary_histories', 'esi_amount', {
        type: Sequelize.STRING,
        defaultValue: '0',
        allowNull: true
      });
    }
    if (!cols.pf_amount) {
      await queryInterface.addColumn('staff_salary_histories', 'pf_amount', {
        type: Sequelize.STRING,
        defaultValue: '0',
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('staff_salary_histories', 'esi_amount');
    await queryInterface.removeColumn('staff_salary_histories', 'pf_amount');
  }
};