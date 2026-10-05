'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class staff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       staff.hasMany(models.TimeIntervals, {
        foreignKey: "staff_id",
        as: "timeIntervals",
      });
    }
  }
  staff.init({
    staff_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    surname_id: DataTypes.INTEGER,
    staff_code: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    age: DataTypes.INTEGER,
    address: DataTypes.STRING,
    vehicle_no: DataTypes.STRING,
    caste_type_id: DataTypes.INTEGER,

    staff_profile_image_name: DataTypes.STRING,
    expected_salary: DataTypes.STRING,
    time_to_join_id: DataTypes.STRING,
    preferred_location_id: DataTypes.STRING,
    references_by: DataTypes.STRING,
    other_information: DataTypes.STRING,


    contact_no: DataTypes.STRING,
    alternative_contact_no: DataTypes.STRING,
    email_id: DataTypes.STRING,
    department_id: DataTypes.INTEGER,
    designation_id: DataTypes.INTEGER,
    bank_account_id: DataTypes.INTEGER,
    branch_id: DataTypes.INTEGER,
    date_of_joining: DataTypes.DATE,
    date_of_reliving: DataTypes.DATE,
    dob: DataTypes.DATE,
    role_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    gender_id: DataTypes.INTEGER,
    martial_status_id: DataTypes.INTEGER,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'staff',
  });
  return staff;
};