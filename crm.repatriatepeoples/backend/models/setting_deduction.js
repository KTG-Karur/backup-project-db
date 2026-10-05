'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class setting_deduction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  setting_deduction.init({
    setting_deduction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deduction_value: DataTypes.STRING,
    is_percentage: DataTypes.BOOLEAN,
    is_deduction: DataTypes.BOOLEAN,
    is_increment: DataTypes.BOOLEAN,
    deduction_name: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'setting_deduction',
  });
  return setting_deduction;
};