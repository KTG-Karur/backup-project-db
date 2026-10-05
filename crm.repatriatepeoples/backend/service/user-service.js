"use strict";

const sequelize = require('../models/index').sequelize;
const messages = require("../helpers/message");
const _ = require('lodash');
const { encrptPassword } = require('../utils/utility');
const Validator = require('fastest-validator')

const schema = {
  userName: { type: "string", optional: false, min:1, max: 100 },
  password: "string|min:6",
}

async function getUser(query) {
  try {
    let iql = {};
    if (query && Object.keys(query).length) {
      if (query.userId) {
        iql.user_id = query.userId;
      }
      if (query.userName) {
        iql.user_name = query.userName;
      }
      if (query.isActive) {
        iql.is_active = query.isActive;
      }
    }
    const result = await sequelize.models.user.findAll({
      attributes: [['user_id', 'userId'],
       ['user_name', 'userName'],
      ['is_active', 'isActive'], ['createdAt', 'createdAt']],
      where: iql,
      raw: true,
      nest: false
    });
    return result;
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function createUser(postData) {
  const v = new Validator()
  try {
    const validationResponse = await v.validate(postData, schema)
    if (validationResponse != true) {
      throw new Error(messages.VALIDATION_FAILED);
    }else{
    postData.password = await encrptPassword(postData.password)
    const excuteMethod = _.mapKeys(postData, (value, key) => _.snakeCase(key))
    const userResult = await sequelize.models.user.create(excuteMethod);
    const req = {
      userId: userResult.user_id
    }
    return await getUser(req);
  }
  } catch (error) {
    throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
  }
}

async function updateUser(userId, putData) {
  try {
    putData.password = await encrptPassword(putData.password)
    const excuteMethod = _.mapKeys(putData, (value, key) => _.snakeCase(key))
    const userResult = await sequelize.models.user.update(excuteMethod, { where: { user_id: userId } });
    const req = {
      userId: userId
    }
    return await getUser(req);
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

async function deleteUser(userId) {
  try {
    const userResult = await sequelize.models.user.destroy({ where: { user_id: userId } });
    if(userResult == 1){
      return "Deleted Successfully...!";
    }else{
      return "Data Not Founded...!";
    }
} catch (error) {
  throw new Error(error.message ? error.message : messages.OPERATION_ERROR);
}
}

module.exports = {
  getUser,
  updateUser,
  createUser,
  deleteUser
};