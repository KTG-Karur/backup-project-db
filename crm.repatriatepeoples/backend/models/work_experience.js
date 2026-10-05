'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class work_experience extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  work_experience.init({
    work_experience_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    organization_name: DataTypes.STRING,
    position: DataTypes.STRING,
    years_of_experience: DataTypes.INTEGER,
    from_date: DataTypes.DATE,
    to_date: DataTypes.DATE,
    gross_pay: DataTypes.STRING,
    work_location: DataTypes.STRING,
    reason_for_leaving: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'work_experience',
  });
  return work_experience;
};