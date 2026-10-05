'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_salary_allocated extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_salary_allocated.init({
    staff_salary_allocated_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    annual_amount: DataTypes.STRING,
    monthly_amount: DataTypes.STRING,
    esi_amount: DataTypes.STRING,
    pf_amount: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'staff_salary_allocated',
  });
  return staff_salary_allocated;
};