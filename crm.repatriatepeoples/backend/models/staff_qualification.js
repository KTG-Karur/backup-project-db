'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_qualification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_qualification.init({
    staff_qualification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    qualification_id: DataTypes.INTEGER,
    passing_year: DataTypes.STRING,
    university_name: DataTypes.STRING,
    percentage: DataTypes.STRING,
    stream: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'staff_qualification',
  });
  return staff_qualification;
};