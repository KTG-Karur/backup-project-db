'use strict';

module.exports = {
  async up(queryInterface) {
    const tableInfo = await queryInterface.describeTable('time_intervals');
    const idCol = tableInfo.id;

    if (!idCol.primaryKey && !idCol.autoIncrement) {
      // Table created without PRIMARY KEY or AUTO_INCREMENT on id
      // First assign unique IDs to any rows that have id=0
      await queryInterface.sequelize.query(
        `SET @row_num = (SELECT COALESCE(MAX(id), 0) FROM time_intervals);
         UPDATE time_intervals SET id = (@row_num := @row_num + 1) WHERE id = 0 ORDER BY record_created_at ASC;`
      );
      // Then add PRIMARY KEY and AUTO_INCREMENT
      await queryInterface.sequelize.query(
        'ALTER TABLE time_intervals MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (id)'
      );
    } else if (!idCol.autoIncrement) {
      await queryInterface.sequelize.query(
        'ALTER TABLE time_intervals MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT'
      );
    }
  },

  async down(queryInterface) {
    // Note: removing PRIMARY KEY and AUTO_INCREMENT is destructive
    const tableInfo = await queryInterface.describeTable('time_intervals');
    if (tableInfo.id.primaryKey) {
      await queryInterface.sequelize.query(
        'ALTER TABLE time_intervals MODIFY COLUMN id INT NOT NULL, DROP PRIMARY KEY'
      );
    }
  },
};
