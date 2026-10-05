'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class salary_increament_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  salary_increament_history.init({
    salary_increament_history_id :{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    salary_amount: DataTypes.STRING,
    esi_amount: DataTypes.STRING,
    pf_amount: DataTypes.STRING,
    annual_amount: DataTypes.STRING,
    increament_date: DataTypes.DATE,
    increament_by: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'salary_increament_history',
  });
  return salary_increament_history;
};