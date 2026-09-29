const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('../utils/sendTokens');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');

const SAFE = 'id, nama, email, role, telepon, alamat, foto_url, status, created_at, last_login';
const ALLOWED_SORT = ['nama', 'email', 'role', 'status', 'created_at', 'last_login'];

/**
 * GET /api/users  (admin only) - list + search + pagination
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, status, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params: searchParams } = buildSearchFilter(search, ['nama', 'email'], 1);

  const extra = [];
  let paramIdx = 1 + searchParams.length;
  if (role) {
    extra.push(`role = $${paramIdx++}`);
    searchParams.push(role);
  }
  if (status) {
    extra.push(`status = $${paramIdx++}`);
    searchParams.push(status);
  }

  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : '']
    .filter(Boolean)
    .join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'created_at');

  const dataQuery = `SELECT ${SAFE} FROM users ${where} ${sort}`;
  const countQuery = `SELECT COUNT(*) FROM users ${where}`;

  const { rows, total } = await paginateQuery({
    dataQuery,
    countQuery,
    params: searchParams,
    limit,
    offset,
    startParamIndex: paramIdx,
  });

  const { page } = req.pagination;

  res.status(200).json({
    status: 'success',
    message: 'Daftar user',
    data: { users: rows.map(sanitizeUser), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } },
  });
});

/**
 * GET /api/users/:id  (admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(`SELECT ${SAFE} FROM users WHERE id = $1`, [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }
  res.status(200).json({ status: 'success', data: { user: sanitizeUser(rows[0]) } });
});

/**
 * POST /api/users  (admin only) - admin membuatkan akun untuk orang lain
 */
const createUser = asyncHandler(async (req, res) => {
  const { nama, email, password, role = 'jamaah', telepon, alamat, status = 'aktif' } = req.body;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw ApiError.conflict('Email sudah terdaftar');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (nama, email, password, role, telepon, alamat, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${SAFE}`,
    [nama, email, hashedPassword, role, telepon || null, alamat || null, status]
  );

  const user = rows[0];
  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'users', recordId: user.id, detail: { nama, email, role } }, req);

  res.status(201).json({ status: 'success', message: 'User berhasil dibuat', data: { user: sanitizeUser(user) } });
});

/**
 * PUT /api/users/:id  (admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nama, email, role, telepon, alamat, status, password } = req.body;

  const existing = await query(`SELECT ${SAFE} FROM users WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  if (email && email !== existing.rows[0].email) {
    const dup = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (dup.rows.length > 0) {
      throw ApiError.conflict('Email sudah digunakan user lain');
    }
  }

  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 12);
  }

  const { rows } = await query(
    `UPDATE users
     SET nama       = COALESCE($1, nama),
         email      = COALESCE($2, email),
         role       = COALESCE($3, role),
         telepon    = COALESCE($4, telepon),
         alamat     = COALESCE($5, alamat),
         status     = COALESCE($6, status),
         password   = COALESCE($7, password)
     WHERE id = $8
     RETURNING ${SAFE}`,
    [nama || null, email || null, role || null, telepon ?? null, alamat ?? null, status || null, hashedPassword, id]
  );

  const user = rows[0];
  await logAudit(
    { userId: req.user.id, aksi: 'UPDATE', modul: 'users', recordId: id, detail: { before: existing.rows[0], after: sanitizeUser(user) } },
    req
  );

  res.status(200).json({ status: 'success', message: 'User berhasil diperbarui', data: { user: sanitizeUser(user) } });
});

/**
 * DELETE /api/users/:id  (admin only) - tidak bisa hapus diri sendiri
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    throw ApiError.badRequest('Tidak dapat menghapus akun sendiri');
  }

  const { rows } = await query(`SELECT id, nama, role FROM users WHERE id = $1`, [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  await query('DELETE FROM users WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'users', recordId: id, detail: { deleted: rows[0] } }, req);

  res.status(200).json({ status: 'success', message: 'User berhasil dihapus' });
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
