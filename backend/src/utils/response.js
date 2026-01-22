const { validationResult } = require('express-validator');

/**
 * Validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages,
      errors: errors.array(),
    });
  }
  
  next();
};

/**
 * Standard API response
 */
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

/**
 * Error response
 */
const sendError = (res, message, statusCode = 400, data = null) => {
  return sendResponse(res, statusCode, false, message, data);
};

module.exports = {
  validate,
  sendResponse,
  sendSuccess,
  sendError,
};
