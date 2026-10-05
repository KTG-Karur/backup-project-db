'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_relation_details extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_relation_details.init({
    staff_relation_details_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    relation_id: DataTypes.INTEGER,
    contact_no: DataTypes.STRING,
    relation_dob: DataTypes.DATE,
    qualification_id: DataTypes.INTEGER,
    occupation: DataTypes.STRING,
    relation_name: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'staff_relation_details',
  });
  return staff_relation_details;
};