'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_salary_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_salary_history.init({
    staff_salary_history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    salary_date: DataTypes.DATE,
    salaried_month: DataTypes.STRING,
    attendance_based_salary: DataTypes.STRING,
    deduction_details: DataTypes.STRING,
    attendance_list: DataTypes.STRING,
    salary_details: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'staff_salary_history',
  });
  return staff_salary_history;
};