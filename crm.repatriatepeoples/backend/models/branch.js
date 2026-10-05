'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class branch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  branch.init({
    branch_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    branch_name: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    pincode: DataTypes.STRING,
    email: DataTypes.STRING,
    contact_no: DataTypes.STRING,
    branch_admin_id: DataTypes.INTEGER,
    latitude: {
      type: DataTypes.DECIMAL(11, 7),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 7),
      allowNull: true
    },
    allowed_radius: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 100
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'branch',
  });
  return branch;
};