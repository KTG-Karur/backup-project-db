'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_training extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_training.init({
    staff_training_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    staff_training_code: DataTypes.STRING,
    staff_training_date: DataTypes.DATE,
    from_date: DataTypes.DATE,
    to_date: DataTypes.DATE,
    from_place: DataTypes.STRING,
    to_place: DataTypes.STRING,
    reason: DataTypes.STRING,
    staff_training_by: DataTypes.INTEGER,
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 28
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'staff_training',
  });
  return staff_training;
};