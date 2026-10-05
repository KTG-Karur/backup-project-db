'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class employee_tracking_report extends Model {
    static associate(models) {
      employee_tracking_report.belongsTo(models.staff, {
        foreignKey: 'staff_id',
        as: 'staff'
      });
    }
  }

  employee_tracking_report.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    employee_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tracking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_distance_km: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0.000
    },
    mobile_model: {
      type: DataTypes.STRING
    },
    battery_level: {
      type: DataTypes.STRING
    },
    tracking_start_time: {
      type: DataTypes.DATE
    },
    tracking_end_time: {
      type: DataTypes.DATE
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'employee_tracking_report',
    tableName: 'employee_tracking_reports',
    timestamps: true
  });

  return employee_tracking_report;
};
