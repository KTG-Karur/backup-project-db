"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class staff_onduty extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_onduty.init(
    {
      staff_onduty_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      staff_id: DataTypes.INTEGER,
      day_count: DataTypes.INTEGER,
      reason: DataTypes.STRING,
      from_date: DataTypes.DATE,
      to_date: DataTypes.DATE,
      spoken_date: DataTypes.DATE,
      spoken_time: DataTypes.STRING,
      spoken_staff_id: DataTypes.STRING,
      approved_by: DataTypes.INTEGER,
      branch_id: DataTypes.INTEGER,
      status_id: {
        type: DataTypes.INTEGER,
        defaultValue: 28,
      },
    },
    {
      sequelize,
      modelName: "staff_onduties",
    }
  );
  return staff_onduty;
};
