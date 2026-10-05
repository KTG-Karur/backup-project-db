"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TimeIntervals extends Model {
    static associate(models) {
      // Use the exact model name 'staff' (lowercase)
      TimeIntervals.belongsTo(models.staff, {
        foreignKey: "staff_id",
        as: "staff",
      });
    }
  }

  TimeIntervals.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      time_status: DataTypes.BIGINT,
      attendance_mark_type: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      attendance_type: DataTypes.INTEGER,
      image_name: DataTypes.STRING(500),
      network_status: DataTypes.STRING(50),
      battery: DataTypes.STRING(10),
      flight_mode: DataTypes.STRING(10),
      address: DataTypes.TEXT,
      brand: DataTypes.STRING(100),
      manufacturer: DataTypes.STRING(100),
      board: DataTypes.STRING(100),
      device: DataTypes.STRING(100),
      display: DataTypes.STRING(200),
      hardware: DataTypes.STRING(100),
      model: DataTypes.STRING(100),
      product: DataTypes.STRING(100),
      updated_at: DataTypes.BIGINT,
      latitude: DataTypes.STRING(50),
      longitude: DataTypes.STRING(50),
      coordinates: DataTypes.JSON,
      mongo_id: DataTypes.STRING(100),
      action_type: DataTypes.STRING(100),
      record_created_at: DataTypes.BIGINT,
      coordinates_points: DataTypes.STRING(100),
      work_time: DataTypes.STRING(50),
      total_work_time: DataTypes.STRING(50),
      distance: DataTypes.STRING(50),
      speed: DataTypes.STRING(50),
      km_difference: DataTypes.STRING(50),
      time_travelled: DataTypes.STRING(50),
      mobile_status: DataTypes.STRING(100),
      image_url: DataTypes.TEXT,
      form_detail_id: DataTypes.STRING(100),
      form_id: DataTypes.STRING(100),
      client_form: DataTypes.STRING(200),
      branch_visit: DataTypes.STRING(200),
      centre_no_name: DataTypes.STRING(200),
      member_name: DataTypes.STRING(200),
      collection_amount: DataTypes.STRING(100),
      cell_no_name: DataTypes.STRING(200),
      attachment: DataTypes.TEXT,
      next_due_date: DataTypes.STRING(100),
      form_data: DataTypes.JSON,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "TimeIntervals",
      tableName: "time_intervals",
      timestamps: true,
    }
  );

  return TimeIntervals;
};