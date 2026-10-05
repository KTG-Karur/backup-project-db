'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_attendance.init({
    staff_attendance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    attendance_date: DataTypes.DATE,
    staff_id: DataTypes.INTEGER,
    branch_id: DataTypes.INTEGER,
    department_id: DataTypes.INTEGER,
    attendance_status_id: DataTypes.INTEGER,
    attendance_incharge_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'staff_attendance',
  });
  return staff_attendance;
};