const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware yang dijalankan SETELAH chain express-validator.
 * Mengumpulkan hasil validasi & melempar ApiError(422) bila ada error.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value ?? undefined,
    }));
    throw ApiError.badRequest('Validasi gagal', details);
  }
  next();
};

module.exports = validate;
