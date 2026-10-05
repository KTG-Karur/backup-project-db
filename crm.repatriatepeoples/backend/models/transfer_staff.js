'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transfer_staff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  transfer_staff.init({
    transfer_staff_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    transfer_code: DataTypes.STRING,
    joining_date: DataTypes.DATE,
    relieving_date: DataTypes.DATE,
    transfer_from: DataTypes.STRING,
    transfer_to: DataTypes.STRING,
    transfered_by: DataTypes.INTEGER,
    branch_id: DataTypes.INTEGER,
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 28,
    },
  }, {
    sequelize,
    modelName: 'transfer_staff',
  });
  return transfer_staff;
};