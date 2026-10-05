'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class deputation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  deputation.init({
    deputation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    deputation_code: DataTypes.STRING,
    deputation_date: DataTypes.DATE,
    from_date: DataTypes.DATE,
    to_date: DataTypes.DATE,
    from_place: DataTypes.STRING,
    to_place: DataTypes.STRING,
    reason: DataTypes.STRING,
    deputation_by: DataTypes.INTEGER,
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 28,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'deputation',
  });
  return deputation;
};