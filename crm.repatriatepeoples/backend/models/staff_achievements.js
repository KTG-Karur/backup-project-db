'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_achievements extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_achievements.init({
    staff_achievement_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    achievement_at_id: DataTypes.INTEGER,
    achievement_title_id: DataTypes.INTEGER,
    achievement_details: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'staff_achievements',
  });
  return staff_achievements;
};