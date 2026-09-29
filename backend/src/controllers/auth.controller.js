const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateTokens, verifyRefreshToken, cookieOptions } = require('../utils/token');
const { logAudit } = require('../utils/audit');
const { sanitizeUser } = require('../utils/sendTokens');
const config = require('../config/env');

const SAFE_USER_FIELDS = 'id, nama, email, role, telepon, alamat, foto_url, status, created_at';

/**
 * POST /api/auth/register
 * Register jamaah baru. Role default 'jamaah'. Admin bisa menentukan role.
 */
const register = asyncHandler(async (req, res) => {
  const { nama, email, password, role = 'jamaah', telepon, alamat } = req.body;

  // Hanya admin yang bisa membuat akun dengan role pengurus/admin
  const assignedRole = req.user?.role === 'admin' && role ? role : 'jamaah';

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw ApiError.conflict('Email sudah terdaftar');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `INSERT INTO users (nama, email, password, role, telepon, alamat)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SAFE_USER_FIELDS}`,
    [nama, email, hashedPassword, assignedRole, telepon || null, alamat || null]
  );

  const user = rows[0];
  const { accessToken, refreshToken } = generateTokens(user);

  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
  await logAudit({ userId: user.id, aksi: 'CREATE', modul: 'users', recordId: user.id, detail: { nama, email, role: assignedRole } }, req);

  res.cookie(config.jwt.cookieName, refreshToken, cookieOptions());

  res.status(201).json({
    status: 'success',
    message: 'Registrasi berhasil',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(`SELECT id, nama, email, password, role, telepon, alamat, foto_url, status FROM users WHERE email = $1`, [email]);
  if (rows.length === 0) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  if (user.status !== 'aktif') {
    throw ApiError.forbidden('Akun Anda dinonaktifkan. Hubungi administrator.');
  }

  const { accessToken, refreshToken } = generateTokens(user);

  await query(
    `UPDATE users SET last_login = NOW(), refresh_token = $1 WHERE id = $2`,
    [refreshToken, user.id]
  );
  await logAudit({ userId: user.id, aksi: 'LOGIN', modul: 'auth', recordId: user.id }, req);

  res.cookie(config.jwt.cookieName, refreshToken, cookieOptions());

  delete user.password;

  res.status(200).json({
    status: 'success',
    message: 'Login berhasil',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[config.jwt.cookieName] || req.body?.refreshToken;
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [decoded.id]);
      await logAudit({ userId: decoded.id, aksi: 'LOGOUT', modul: 'auth', recordId: decoded.id }, req);
    } catch {
      // token tidak valid -> tidak perlu lakukan apa-apa
    }
  }

  res.clearCookie(config.jwt.cookieName, { path: '/api/auth' });

  res.status(200).json({ status: 'success', message: 'Logout berhasil' });
});

/**
 * POST /api/auth/refresh  (rotation refresh token)
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[config.jwt.cookieName] || req.body?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('Refresh token tidak ditemukan');
  }

  const decoded = verifyRefreshToken(token);

  const { rows } = await query(`SELECT id, nama, email, role, refresh_token, status FROM users WHERE id = $1`, [decoded.id]);
  if (rows.length === 0 || rows[0].refresh_token !== token) {
    throw ApiError.unauthorized('Refresh token tidak valid (sudah digunakan/logout)');
  }

  const user = rows[0];
  if (user.status !== 'aktif') {
    throw ApiError.forbidden('Akun dinonaktifkan');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

  res.cookie(config.jwt.cookieName, newRefreshToken, cookieOptions());

  res.status(200).json({
    status: 'success',
    data: { accessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) },
  });
});

/**
 * GET /api/auth/me  (profil user yang login)
 */
const me = asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT ${SAFE_USER_FIELDS} FROM users WHERE id = $1`, [req.user.id]);
  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }
  res.status(200).json({ status: 'success', data: { user: rows[0] } });
});

/**
 * PUT /api/auth/me  (update profil sendiri)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { nama, telepon, alamat, fotoUrl } = req.body;

  const { rows } = await query(
    `UPDATE users
     SET nama = COALESCE($1, nama),
         telepon = COALESCE($2, telepon),
         alamat = COALESCE($3, alamat),
         foto_url = COALESCE($4, foto_url)
     WHERE id = $5
     RETURNING ${SAFE_USER_FIELDS}`,
    [nama || null, telepon ?? null, alamat ?? null, fotoUrl ?? null, req.user.id]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'users', recordId: req.user.id }, req);

  res.status(200).json({ status: 'success', message: 'Profil diperbarui', data: { user: rows[0] } });
});

/**
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { passwordLama, passwordBaru } = req.body;

  const { rows } = await query('SELECT id, password FROM users WHERE id = $1', [req.user.id]);
  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  const isMatch = await bcrypt.compare(passwordLama, rows[0].password);
  if (!isMatch) {
    throw ApiError.badRequest('Password lama salah');
  }

  const hashedPassword = await bcrypt.hash(passwordBaru, 12);
  await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'auth', recordId: req.user.id, detail: { field: 'password' } }, req);

  res.status(200).json({ status: 'success', message: 'Password berhasil diubah' });
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  me,
  updateProfile,
  changePassword,
};
