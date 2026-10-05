'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class advance_payment_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  advance_payment_history.init({
    advance_payment_history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_advance_id: DataTypes.INTEGER,
    account_id: DataTypes.INTEGER,
    through_id: DataTypes.INTEGER,
    paid_amount: DataTypes.STRING,
    balance_amount: DataTypes.STRING,
    paid_date: DataTypes.DATE,
    paid_to: DataTypes.INTEGER,
    branch_id: DataTypes.INTEGER,
    description: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'advance_payment_history',
  });
  return advance_payment_history;
};