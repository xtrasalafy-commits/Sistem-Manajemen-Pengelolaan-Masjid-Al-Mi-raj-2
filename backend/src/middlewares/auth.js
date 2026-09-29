const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const { query } = require('../config/db');

/**
 * Middleware autentikasi: verifikasi Authorization: Bearer <token>.
 * Melampirkan req.user = { id, nama, email, role }.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (!token || scheme.toLowerCase() !== 'bearer') {
    throw ApiError.unauthorized('Token tidak ditemukan. Silakan login.');
  }

  const decoded = verifyAccessToken(token);

  const { rows } = await query(
    'SELECT id, nama, email, role, status FROM users WHERE id = $1',
    [decoded.id]
  );

  if (rows.length === 0) {
    throw ApiError.unauthorized('User tidak ditemukan');
  }

  const user = rows[0];
  if (user.status !== 'aktif') {
    throw ApiError.forbidden('Akun Anda dinonaktifkan. Hubungi administrator.');
  }

  req.user = { id: user.id, nama: user.nama, email: user.email, role: user.role };
  next();
});

/**
 * Middleware otorisasi berbasis role (RBAC).
 * @param  {...string} roles - 'admin' | 'pengurus' | 'jamaah'
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Anda belum terautentikasi');
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Akses ditolak. Diperlukan role: ${roles.join(' / ')}`);
  }
  next();
};

/** Alias: hanya admin. */
const adminOnly = authorize('admin');

/** Admin & pengurus. */
const adminAndPengurus = authorize('admin', 'pengurus');

module.exports = { authenticate, authorize, adminOnly, adminAndPengurus };
