'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class setting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  setting.init({
    settings_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false
    },
    company_name: DataTypes.STRING,
    company_mobile: DataTypes.STRING,
    company_alt_mobile: DataTypes.STRING,
    company_mail: DataTypes.STRING,
    company_gst_no: DataTypes.STRING,
    company_address: DataTypes.STRING,
    company_district: DataTypes.STRING,
    company_state: DataTypes.STRING,
    company_pincode: DataTypes.STRING,
    company_logo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'setting',
  });
  return setting;
};