'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class staff_geolocations extends Model {
    static associate(models) {
      staff_geolocations.belongsTo(models.staff, {
        foreignKey: 'staff_id',
        as: 'staff'
      });
    }
  }

  staff_geolocations.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'Point'
    },
    latitude: {
      type: DataTypes.STRING
    },
    longitude: {
      type: DataTypes.STRING
    },
    attendance_mark_type: {
      type: DataTypes.INTEGER,
      field: 'attendanceMarkType'
    },
    attendance_type: {
      type: DataTypes.INTEGER,
      field: 'attendanceType'
    },
    action_type: {
      type: DataTypes.STRING,
      field: 'actionType'
    },
    battery: {
      type: DataTypes.STRING
    },
    network_status: {
      type: DataTypes.STRING,
      field: 'networkStatus'
    },
    permission_status: {
      type: DataTypes.STRING,
      field: 'permissionStatus'
    },
    status: {
      type: DataTypes.STRING,
      field: 'status'
    },
    flight_mode: {
      type: DataTypes.STRING,
      field: 'flightMode'
    },
    speed: {
      type: DataTypes.STRING
    },
    distance: {
      type: DataTypes.STRING
    },
    km_difference: {
      type: DataTypes.STRING,
      field: 'kmDifference'
    },
    total_distance: {
      type: DataTypes.STRING,
      field: 'totalDistance'
    },
    coordinates_points: {
      type: DataTypes.STRING,
      field: 'coordinatesPoints'
    },
    image_name: {
      type: DataTypes.STRING,
      field: 'imageName'
    },
    image_url: {
      type: DataTypes.STRING,
      field: 'imageUrl'
    },
    record_created_at: {
      type: DataTypes.BIGINT,
      field: 'record_createdAt'
    }
  }, {
    sequelize,
    modelName: 'staff_geolocations',
    tableName: 'staff_geolocations',
    underscored: false, // Keep as false since we're manually mapping camelCase fields
    timestamps: true // createdAt and updatedAt are handled by Sequelize
  });

  return staff_geolocations;
};