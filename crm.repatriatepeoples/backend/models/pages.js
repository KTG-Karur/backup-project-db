'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  pages.init({
    page_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: DataTypes.STRING,
    parent_id: DataTypes.INTEGER,
    icon_name: DataTypes.STRING,
    page_name: DataTypes.STRING,
    page_url: DataTypes.STRING,
    is_title: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    access_ids: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }

  }, {
    sequelize,
    modelName: 'pages',
  });
  return pages;
};