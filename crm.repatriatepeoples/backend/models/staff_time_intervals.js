'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class staff_time_intervals extends Model {
    static associate(models) {
      staff_time_intervals.belongsTo(models.staff, {
        foreignKey: 'staff_id',
        as: 'staff'
      });
    }
  }

  staff_time_intervals.init({

    interval_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    timeStatus: DataTypes.BIGINT,      
    attendanceMarkType: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    attendanceType: DataTypes.INTEGER,

    address: DataTypes.STRING,
    imageName: DataTypes.STRING,
    networkStatus: DataTypes.STRING,
    battery: DataTypes.STRING,
    flightMode: DataTypes.STRING,

    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING,

    coordinates: {
      type: DataTypes.JSON  
    },

    actionType: DataTypes.STRING, 

    workTime: DataTypes.STRING,
    totalWorkTime: DataTypes.STRING,
    distance: DataTypes.STRING,
    speed: DataTypes.STRING,
    kmDifference: DataTypes.STRING,
    timeTravelled: DataTypes.STRING,
    mobileStatus: DataTypes.STRING,

    brand: DataTypes.STRING,
    manufacturer: DataTypes.STRING,
    board: DataTypes.STRING,
    device: DataTypes.STRING,
    display: DataTypes.STRING,
    hardware: DataTypes.STRING,
    model: DataTypes.STRING,
    product: DataTypes.STRING,

    image: DataTypes.STRING,

    updatedAtMobile: DataTypes.BIGINT 

  }, {
    sequelize,
    modelName: 'staff_time_intervals',
  });

  return staff_time_intervals;
};
