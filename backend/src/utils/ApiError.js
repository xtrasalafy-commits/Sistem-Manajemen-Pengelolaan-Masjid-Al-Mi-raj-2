/**
 * Class error terstandar agar response API konsisten.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized, akses ditolak') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden, Anda tidak memiliki izin') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Data tidak ditemukan') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Data sudah ada (konflik)') {
    return new ApiError(409, message);
  }

  static internal(message = 'Terjadi kesalahan pada server') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
