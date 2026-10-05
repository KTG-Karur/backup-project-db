'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class petrol_allowance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  petrol_allowance.init({
    petrol_allowance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    allowance_date: {
      type: DataTypes.DATE,
      // defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'),
    },
    from_place: DataTypes.STRING,
    to_place: DataTypes.STRING,
    activity_id: DataTypes.STRING,
    total_km: DataTypes.INTEGER,
    bill_image_name: DataTypes.STRING,
    bill_no: DataTypes.STRING,
    date_of_purchase: DataTypes.DATE,
    name_of_dealer: DataTypes.STRING,
    price_per_litre: DataTypes.STRING,
    qty_per_litre: DataTypes.STRING,
    total_amount: DataTypes.STRING,
    branch_id: DataTypes.INTEGER,
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 28,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    },
    is_image_approved: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    }
  }, {
    sequelize,
    modelName: 'petrol_allowance',
  });
  return petrol_allowance;
};