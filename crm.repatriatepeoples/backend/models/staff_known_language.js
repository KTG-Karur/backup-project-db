'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_known_language extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_known_language.init({
    staff_known_language_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    language_id: DataTypes.INTEGER,
    language_speak: DataTypes.BOOLEAN,
    language_read: DataTypes.BOOLEAN,
    language_write: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'staff_known_language',
  });
  return staff_known_language;
};