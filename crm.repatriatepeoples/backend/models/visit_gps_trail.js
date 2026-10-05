'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class visit_gps_trail extends Model {
    static associate(models) {
      visit_gps_trail.belongsTo(models.branch_location_entry_log, {
        foreignKey: 'entry_log_id', as: 'entryLog'
      });
      visit_gps_trail.belongsTo(models.staff, {
        foreignKey: 'staff_id', as: 'staff'
      });
    }
  }
  visit_gps_trail.init({
    gps_id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    entry_log_id:     { type: DataTypes.INTEGER, allowNull: false },
    staff_id:         { type: DataTypes.INTEGER, allowNull: true },
    latitude:         { type: DataTypes.DECIMAL(11, 7) },
    longitude:        { type: DataTypes.DECIMAL(11, 7) },
    recorded_at:      { type: DataTypes.DATE },
    battery_level:    { type: DataTypes.STRING },
    speed_kmph:       { type: DataTypes.DECIMAL(6, 2) },
    accuracy_meters:  { type: DataTypes.DECIMAL(6, 2) },
  }, {
    sequelize,
    modelName: 'visit_gps_trail',
    tableName: 'visit_gps_trails',
    timestamps: true
  });
  return visit_gps_trail;
};
