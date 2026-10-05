'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class branch_location extends Model {
    static associate(models) {
      branch_location.belongsTo(models.staff, {
        foreignKey: 'staff_id',
        as: 'staff'
      });
      branch_location.belongsTo(models.branch, {
        foreignKey: 'branch_id',
        as: 'branch'
      });
    }
  }

  branch_location.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    employee_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    branch_name: {
      type: DataTypes.STRING
    },
    registered_latitude: {
      type: DataTypes.DECIMAL(11, 7)
    },
    registered_longitude: {
      type: DataTypes.DECIMAL(11, 7)
    },
    live_latitude: {
      type: DataTypes.DECIMAL(11, 7)
    },
    live_longitude: {
      type: DataTypes.DECIMAL(11, 7)
    },
    role: {
      type: DataTypes.STRING
    },
    office_entry_time: {
      type: DataTypes.TIME
    },
    tracking_status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    notification_status: {
      type: DataTypes.STRING,
      defaultValue: 'not_sent'
    },
    arrival_time: {
      type: DataTypes.DATE
    },
    fcm_token: {
      type: DataTypes.TEXT
    },
    location_radius: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'branch_location',
    tableName: 'branch_locations',
    timestamps: true
  });

  return branch_location;
};
