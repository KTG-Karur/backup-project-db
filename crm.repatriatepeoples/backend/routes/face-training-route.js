"use strict";

const Validator = require("fastest-validator");
const { verifyToken } = require("../middleware/auth");
const { ResponseEntry } = require("../helpers/construct-response");
const responseCode = require("../helpers/status-code");
const messages = require("../helpers/message");
const faceTrainingServices = require("../service/face-training-service");
const _ = require("lodash");

// Validation schema
const schema = {
  staffId: {
    type: "number",
    integer: true,
    positive: true,
    optional: false,
  },
  staffCode: {
    type: "string",
    min: 1,
    max: 50,
    optional: false,
  },
  name: {
    type: "string",
    min: 1,
    max: 200,
    optional: false,
  },
  images: {
    type: "array",
    items: "string",
    optional: true,
    default: [],
  },
  statusLabel: {
    type: "string",
    optional: true,
    enum: ["Pending", "Trained", "Retraining", "Failed"],
  },
  color: {
    type: "string",
    optional: true,
    pattern: /^0x[0-9A-F]{8}$/i,
  },
  textColor: {
    type: "string",
    optional: true,
    pattern: /^0x[0-9A-F]{8}$/i,
  },
  chipColor: {
    type: "string",
    optional: true,
    pattern: /^0x[0-9A-F]{8}$/i,
  },
  designation: {
    type: "string",
    optional: true,
    max: 200,
  },
  trainStatus: {
    type: "boolean",
    optional: true,
  },
  modelVersion: {
    type: "string",
    optional: true,
    max: 50,
  },
  trainedAt: {
    type: "number",
    optional: true,
    positive: true,
  },
  trainingAttempts: {
    type: "number",
    integer: true,
    min: 0,
    optional: true,
  },
  lastTrainingError: {
    type: "string",
    optional: true,
  },
  metadata: {
    type: "object",
    optional: true,
  },
  createdBy: {
    type: "number",
    integer: true,
    optional: true,
  },
  updatedBy: {
    type: "number",
    integer: true,
    optional: true,
  },
};

async function getFaceTrainings2(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await faceTrainingServices.getFaceTrainings(
      req.query
    );
    if (
      !responseEntries.data.data ||
      responseEntries.data.data.length === 0
    ) {
      responseEntries.message = messages.DATA_NOT_FOUND;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function getFaceTrainings(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    const result = await faceTrainingServices.getFaceTrainings(req.query);
    
    responseEntries.data = result;
    
    if (!responseEntries.data.data || responseEntries.data.data.length === 0) {
      responseEntries.message = messages.DATA_NOT_FOUND;
    } else {
      responseEntries.message = `Found ${result.data.length} staff records`;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function getFaceTrainingDetails(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    if (!req.query.id && !req.query.staffId && !req.query.staffCode) {
      responseEntries.error = true;
      responseEntries.message =
        "id, staffId, or staffCode parameter is required";
      responseEntries.code = responseCode.BAD_REQUEST;
      return res.status(responseCode.BAD_REQUEST).send(responseEntries);
    }

    responseEntries.data = await faceTrainingServices.getFaceTrainingDetails(
      req.query
    );
    if (!responseEntries.data) {
      responseEntries.message = messages.DATA_NOT_FOUND;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function createFaceTraining(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const validationResponse = await v.validate(req.body, schema);
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await faceTrainingServices.createFaceTraining(
        req.body
      );
      if (!responseEntries.data) {
        responseEntries.message = messages.DATA_NOT_FOUND;
      } else {
        responseEntries.message = messages.CREATE_SUCCESS;
      }
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function updateFaceTraining(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    const filteredSchema = _.pick(schema, Object.keys(req.body));
    const validationResponse = v.validate(req.body, filteredSchema);
    if (validationResponse !== true) {
      throw new Error(messages.VALIDATION_FAILED);
    } else {
      responseEntries.data = await faceTrainingServices.updateFaceTraining(
        req.params.id,
        req.body
      );
      if (!responseEntries.data) {
        responseEntries.message = messages.DATA_NOT_FOUND;
      } else {
        responseEntries.message = messages.UPDATE_SUCCESS;
      }
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = error.code
      ? error.code
      : responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function deleteFaceTraining(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    responseEntries.data = await faceTrainingServices.deleteFaceTraining(
      req.params.id
    );
    if (!responseEntries.data) {
      responseEntries.message = messages.DATA_NOT_FOUND;
    } else {
      responseEntries.message = messages.DELETE_SUCCESS;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = error.code
      ? error.code
      : responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function bulkCreateFaceTrainings(req, res) {
  const responseEntries = new ResponseEntry();
  const v = new Validator();
  try {
    if (!Array.isArray(req.body)) {
      throw new Error("Request body must be an array");
    }

    for (const item of req.body) {
      const validationResponse = await v.validate(item, schema);
      if (validationResponse !== true) {
        throw new Error(messages.VALIDATION_FAILED);
      }
    }

    responseEntries.data = await faceTrainingServices.bulkCreateFaceTrainings(
      req.body
    );
    if (!responseEntries.data || responseEntries.data.length === 0) {
      responseEntries.message = messages.DATA_NOT_FOUND;
    } else {
      responseEntries.message = messages.BULK_CREATE_SUCCESS;
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

async function retrainFaceModel(req, res) {
  const responseEntries = new ResponseEntry();
  try {
    if (!req.params.staffId) {
      responseEntries.error = true;
      responseEntries.message = "staffId parameter is required";
      responseEntries.code = responseCode.BAD_REQUEST;
      return res.status(responseCode.BAD_REQUEST).send(responseEntries);
    }

    responseEntries.data = await faceTrainingServices.retrainFaceModel(
      req.params.staffId
    );
    if (!responseEntries.data) {
      responseEntries.message = messages.DATA_NOT_FOUND;
    } else {
      responseEntries.message = "Face model retraining initiated successfully";
    }
  } catch (error) {
    responseEntries.error = true;
    responseEntries.message = error.message ? error.message : error;
    responseEntries.code = responseCode.BAD_REQUEST;
    res.status(responseCode.BAD_REQUEST);
  } finally {
    res.send(responseEntries);
  }
}

module.exports = async function (fastify) {
  // Get all face trainings with pagination and filters
  fastify.route({
    method: "GET",
    url: "/face-training",
    // preHandler: verifyToken,
    handler: getFaceTrainings,
  });

  // Get specific face training details
  fastify.route({
    method: "GET",
    url: "/face-training-details",
    // preHandler: verifyToken,
    handler: getFaceTrainingDetails,
  });

  // Create new face training
  fastify.route({
    method: "POST",
    url: "/face-training",
    // preHandler: verifyToken,
    handler: createFaceTraining,
  });

  // Bulk create face trainings
  fastify.route({
    method: "POST",
    url: "/face-trainings/bulk",
    // preHandler: verifyToken,
    handler: bulkCreateFaceTrainings,
  });

  // Update face training
  fastify.route({
    method: "PUT",
    url: "/face-training/:id",
    // preHandler: verifyToken,
    handler: updateFaceTraining,
  });

  // Delete face training
  fastify.route({
    method: "DELETE",
    url: "/face-training/:id",
    // preHandler: verifyToken,
    handler: deleteFaceTraining,
  });

  // Retrain face model for specific staff
  fastify.route({
    method: "POST",
    url: "/face-training/retrain/:staffId",
    // preHandler: verifyToken,
    handler: retrainFaceModel,
  });

  // Get face training by staff code
  fastify.route({
    method: "GET",
    url: "/face-training/staff/:staffCode",
    // preHandler: verifyToken,
    handler: async (req, res) => {
      const responseEntries = new ResponseEntry();
      try {
        responseEntries.data = await faceTrainingServices.getFaceTrainingDetails(
          { staffCode: req.params.staffCode }
        );
        if (!responseEntries.data) {
          responseEntries.message = messages.DATA_NOT_FOUND;
        }
      } catch (error) {
        responseEntries.error = true;
        responseEntries.message = error.message ? error.message : error;
        responseEntries.code = responseCode.BAD_REQUEST;
        res.status(responseCode.BAD_REQUEST);
      } finally {
        res.send(responseEntries);
      }
    },
  });
};