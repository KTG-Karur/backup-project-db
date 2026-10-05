"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class FaceTraining extends Model {
    static associate(models) {
      // Associate with staff model
      FaceTraining.belongsTo(models.staff, {
        foreignKey: "staff_id",
        as: "staff",
      });
    }
  }

  FaceTraining.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      staff_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        validate: {
          isArrayOfStrings(value) {
            if (!Array.isArray(value)) {
              throw new Error("Images must be an array");
            }
            value.forEach((item) => {
              if (typeof item !== "string") {
                throw new Error("All image items must be strings");
              }
            });
          },
        },
      },
      status_label: {
        type: DataTypes.STRING(50),
        defaultValue: "Pending",
      },
      color: {
        type: DataTypes.STRING(20),
      },
      text_color: {
        type: DataTypes.STRING(20),
      },
      chip_color: {
        type: DataTypes.STRING(20),
      },
      designation: {
        type: DataTypes.STRING(200),
      },
      train_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      model_version: {
        type: DataTypes.STRING(50),
      },
      trained_at: {
        type: DataTypes.BIGINT,
      },
      training_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      last_training_error: {
        type: DataTypes.TEXT,
      },
      metadata: {
        type: DataTypes.JSON,
      },
      created_by: {
        type: DataTypes.INTEGER,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "FaceTraining",
      tableName: "face_trainings",
      timestamps: true,
      hooks: {
        beforeCreate: (faceTraining, options) => {
          // Generate statusInfo object based on train_status
          if (faceTraining.train_status) {
            faceTraining.status_label = "Trained";
            faceTraining.color = faceTraining.color || "0xFFDEF9DB";
            faceTraining.text_color = faceTraining.text_color || "0xFF29A01B";
            faceTraining.chip_color = faceTraining.chip_color || "0xFFA1E999";
            faceTraining.trained_at = Date.now();
          } else {
            faceTraining.status_label = "Pending";
            faceTraining.color = faceTraining.color || "0xFFFEE2E2";
            faceTraining.text_color = faceTraining.text_color || "0xFFDC2626";
            faceTraining.chip_color = faceTraining.chip_color || "0xFFFCA5A5";
          }
        },
        beforeUpdate: (faceTraining, options) => {
          // Update statusInfo when train_status changes
          if (faceTraining.changed("train_status")) {
            if (faceTraining.train_status) {
              faceTraining.status_label = "Trained";
              faceTraining.color = "0xFFDEF9DB";
              faceTraining.text_color = "0xFF29A01B";
              faceTraining.chip_color = "0xFFA1E999";
              faceTraining.trained_at = Date.now();
              faceTraining.training_attempts = 0;
              faceTraining.last_training_error = null;
            } else {
              faceTraining.status_label = "Pending";
              faceTraining.color = "0xFFFEE2E2";
              faceTraining.text_color = "0xFFDC2626";
              faceTraining.chip_color = "0xFFFCA5A5";
              faceTraining.trained_at = null;
            }
          }
        },
      },
    }
  );

  return FaceTraining;
};