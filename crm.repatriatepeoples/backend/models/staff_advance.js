'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_advance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_advance.init({
    staff_advance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    branch_id: DataTypes.INTEGER,
    apply_date: DataTypes.DATE,
    approved_date: DataTypes.DATE,
    approved_by: DataTypes.INTEGER,
    amount: DataTypes.STRING,
    reason: DataTypes.STRING,
    paid_amount: DataTypes.STRING,
    balance_amount: DataTypes.STRING,
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
    modelName: 'staff_advance',
  });
  return staff_advance;
};