const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Handler untuk route yang tidak ditemukan (404).
 */
const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route tidak ditemukan: ${req.method} ${req.originalUrl}`));
};

/**
 * Global error handler. Mengonversi semua error menjadi response JSON standar.
 * - ApiError       -> statusCode pesannya sendiri
 * - express-validator -> 422 + detail field errors
 * - PgError (unique violation 23505) -> 409
 * - lainnya         -> 500 (di production pesan disembunyikan)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // express-validator: validation result errors
  if (err?.name === 'ValidationError' && Array.isArray(err.errors)) {
    error = ApiError.badRequest('Validasi gagal', err.errors);
  }

  // PostgreSQL: unique violation
  if (err?.code === '23505') {
    const match = err.detail?.match(/\(([^)]+)\)=\(([^)]+)\)/);
    const msg = match ? `${match[1]} "${match[2]}" sudah digunakan` : 'Data sudah ada (duplikat)';
    error = ApiError.conflict(msg);
  }

  // PostgreSQL: foreign key violation
  if (err?.code === '23503') {
    error = ApiError.badRequest('Referensi data tidak valid (data terkait tidak ditemukan)');
  }

  // PostgreSQL: syntax error (jangan bocorkan detail SQL di production)
  if (err?.code === '42601' || err?.code === '42703') {
    logger.error(`SQL Error: ${err.message}`);
    error = ApiError.internal(config.isProduction ? 'Kesalahan query database' : err.message);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    status: error.status || 'error',
    message: error.message || 'Terjadi kesalahan pada server',
    ...(error.details ? { errors: error.details } : {}),
  };

  // Stack trace hanya di development (membantu debug)
  if (config.isDevelopment && statusCode >= 500) {
    response.stack = error.stack;
  }

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} -> ${error.message}`);
  } else if (config.isDevelopment) {
    logger.warn(`[${req.method}] ${req.originalUrl} -> ${error.message}`);
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
