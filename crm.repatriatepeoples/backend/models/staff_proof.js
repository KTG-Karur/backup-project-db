'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff_proof extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  staff_proof.init({
    staff_proof_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    staff_id: DataTypes.INTEGER,
    proof_type_id: DataTypes.INTEGER,
    proof_number: DataTypes.STRING,
    proof_image_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'staff_proof',
  });
  return staff_proof;
};