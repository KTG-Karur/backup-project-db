'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class status_list extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // status_list.belongsTo(models.status_category, {
      //   foreignKey: 'status_category_id',
      //   onDelete: 'CASCADE'
      // });
    }
  }
  status_list.init({
    status_list_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status_category_id: DataTypes.INTEGER,
    status_name: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'status_list',
  });
  return status_list;
};