/**
 * response.js — Standardised HTTP response helpers
 *
 * All API responses follow the shape:
 *   { success: boolean, message: string, data?: any }
 *
 * Using helpers keeps controller code DRY and the response contract consistent.
 */

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const sendValidationError = (res, errors) => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed.',
    errors,
  });
};

module.exports = { sendSuccess, sendError, sendValidationError };
