'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class bank_account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  bank_account.init({
    bank_account_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    account_holder_name: DataTypes.STRING,
    bank_name: DataTypes.STRING,
    branch_name: DataTypes.STRING,
    account_no: DataTypes.STRING,
    ifsc_code: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    company_account: DataTypes.BOOLEAN,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'bank_account',
  });
  return bank_account;
};