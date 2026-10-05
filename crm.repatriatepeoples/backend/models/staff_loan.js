'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_loan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_loan.init({
    staff_loan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    loan_no: DataTypes.STRING,
    loan_date: DataTypes.DATE,
    staff_id: DataTypes.INTEGER,
    interest_rate: DataTypes.STRING,
    loan_amount: DataTypes.STRING,
    tenure_period: DataTypes.INTEGER,
    process_fees: DataTypes.STRING,
    disbursed_type_id: DataTypes.INTEGER,
    bank_id: DataTypes.INTEGER,
    loan_status_id: DataTypes.INTEGER,
    approved_date: DataTypes.DATE,
    disbursed_date: DataTypes.DATE,
    cancelled_date: DataTypes.DATE,
    approved_by: DataTypes.INTEGER,
    disbursed_by: DataTypes.INTEGER,
    cancelled_by: DataTypes.INTEGER,
    cancelled_reason: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'staff_loan',
  });
  return staff_loan;
};