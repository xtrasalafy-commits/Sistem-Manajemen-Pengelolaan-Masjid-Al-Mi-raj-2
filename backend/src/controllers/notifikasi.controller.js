const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/notifikasi  -> notifikasi untuk user yang login + broadcast
 */
const getMyNotifikasi = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const { rows } = await query(
    `SELECT id, judul, pesan, tipe, data, dibaca, created_at
     FROM notifikasi
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY created_at DESC
     LIMIT $2`,
    [req.user.id, limit]
  );

  const { rows: unread } = await query(
    `SELECT COUNT(*)::int as total FROM notifikasi
     WHERE (user_id = $1 OR user_id IS NULL) AND dibaca = false`,
    [req.user.id]
  );

  res.status(200).json({ status: 'success', data: { notifikasi: rows, belumDibaca: unread[0].total } });
});

/**
 * PUT /api/notifikasi/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query(
    `UPDATE notifikasi SET dibaca = true
     WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [id, req.user.id]
  );
  res.status(200).json({ status: 'success', message: 'Notifikasi ditandai dibaca' });
});

/**
 * PUT /api/notifikasi/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifikasi SET dibaca = true
     WHERE (user_id = $1 OR user_id IS NULL) AND dibaca = false`,
    [req.user.id]
  );
  res.status(200).json({ status: 'success', message: 'Semua notifikasi ditandai dibaca' });
});

/**
 * POST /api/notifikasi/broadcast  (admin only)
 * Body: { judul, pesan, tipe }
 */
const broadcastNotifikasi = asyncHandler(async (req, res) => {
  const { judul, pesan, tipe = 'info', targetRole } = req.body;
  if (!judul || !pesan) throw ApiError.badRequest('judul & pesan wajib diisi');

  const roles = targetRole ? [targetRole] : ['admin', 'pengurus', 'jamaah'];

  const { rows } = await query(
    `INSERT INTO notifikasi (user_id, judul, pesan, tipe)
     SELECT id, $1, $2, $3 FROM users WHERE role = ANY($4::user_role[]) AND status = 'aktif'
     RETURNING id`,
    [judul, pesan, tipe, roles]
  );

  res.status(201).json({
    status: 'success',
    message: `Notifikasi dikirim ke ${rows.length} user`,
    data: { terkirim: rows.length },
  });
});

module.exports = { getMyNotifikasi, markAsRead, markAllAsRead, broadcastNotifikasi };
