const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');

const ALLOWED_SORT = ['tanggal_mulai', 'judul', 'prioritas', 'status', 'created_at'];

/**
 * GET /api/pengumuman
 */
const getAllPengumuman = asyncHandler(async (req, res) => {
  const { search, kategori, prioritas, status, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['judul', 'isi'], 1);

  const extra = [];
  let idx = 1 + params.length;
  if (kategori) {
    extra.push(`kategori = $${idx++}`);
    params.push(kategori);
  }
  if (prioritas) {
    extra.push(`prioritas = $${idx++}`);
    params.push(prioritas);
  }
  if (status) {
    extra.push(`status = $${idx++}`);
    params.push(status);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'tanggal_mulai', 'desc');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT p.id, p.judul, p.isi, p.kategori, p.prioritas, p.tanggal_mulai, p.tanggal_selesai, p.attachment_url, p.status, p.created_at, u.nama as dibuat_oleh
                FROM pengumuman p LEFT JOIN users u ON p.created_by = u.id
                ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM pengumuman p ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  res.status(200).json({
    status: 'success',
    data: {
      pengumuman: rows,
      pagination: { page: req.pagination.page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

/**
 * GET /api/pengumuman/aktif  -> yang sedang aktif (untuk publik/jamaah)
 */
const getPengumumanAktif = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const { rows } = await query(
    `SELECT id, judul, isi, kategori, prioritas, tanggal_mulai, tanggal_selesai, attachment_url
     FROM pengumuman
     WHERE status = 'aktif'
       AND tanggal_mulai <= CURRENT_DATE
       AND (tanggal_selesai IS NULL OR tanggal_selesai >= CURRENT_DATE)
     ORDER BY
       CASE prioritas WHEN 'tinggi' THEN 1 WHEN 'sedang' THEN 2 ELSE 3 END,
       tanggal_mulai DESC
     LIMIT $1`,
    [limit]
  );
  res.status(200).json({ status: 'success', data: { pengumuman: rows } });
});

const getPengumumanById = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, u.nama as dibuat_oleh FROM pengumuman p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw ApiError.notFound('Pengumuman tidak ditemukan');
  res.status(200).json({ status: 'success', data: { pengumuman: rows[0] } });
});

const createPengumuman = asyncHandler(async (req, res) => {
  const { judul, isi, kategori = 'umum', prioritas = 'sedang', tanggalMulai, tanggalSelesai, attachmentUrl, status = 'aktif' } = req.body;

  const { rows } = await query(
    `INSERT INTO pengumuman (judul, isi, kategori, prioritas, tanggal_mulai, tanggal_selesai, attachment_url, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [judul, isi, kategori, prioritas, tanggalMulai, tanggalSelesai || null, attachmentUrl || null, status, req.user.id]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'pengumuman', recordId: rows[0].id, detail: rows[0] }, req);

  // Notifikasi broadcast ke seluruh pengurus/admin
  await query(
    `INSERT INTO notifikasi (user_id, judul, pesan, tipe, data)
     SELECT id, $1, $2, 'pengumuman', $3::jsonb FROM users WHERE role IN ('admin','pengurus') AND status='aktif'`,
    [`Pengumuman: ${judul}`, isi.slice(0, 160), JSON.stringify({ pengumumanId: rows[0].id })]
  );

  res.status(201).json({ status: 'success', message: 'Pengumuman dipublikasikan', data: { pengumuman: rows[0] } });
});

const updatePengumuman = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT * FROM pengumuman WHERE id = $1', [id]);
  if (existing.length === 0) throw ApiError.notFound('Pengumuman tidak ditemukan');

  const before = existing[0];
  const { judul, isi, kategori, prioritas, tanggalMulai, tanggalSelesai, attachmentUrl, status } = req.body;

  const { rows } = await query(
    `UPDATE pengumuman
     SET judul = COALESCE($1, judul), isi = COALESCE($2, isi), kategori = COALESCE($3, kategori),
         prioritas = COALESCE($4, prioritas), tanggal_mulai = COALESCE($5, tanggal_mulai),
         tanggal_selesai = COALESCE($6, tanggal_selesai), attachment_url = COALESCE($7, attachment_url),
         status = COALESCE($8, status)
     WHERE id = $9 RETURNING *`,
    [judul || null, isi || null, kategori || null, prioritas || null, tanggalMulai || null, tanggalSelesai ?? null, attachmentUrl ?? null, status || null, id]
  );

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'pengumuman', recordId: id, detail: { before, after: rows[0] } }, req);

  res.status(200).json({ status: 'success', message: 'Pengumuman diperbarui', data: { pengumuman: rows[0] } });
});

const deletePengumuman = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, judul FROM pengumuman WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('Pengumuman tidak ditemukan');
  await query('DELETE FROM pengumuman WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'pengumuman', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Pengumuman dihapus' });
});

module.exports = {
  getAllPengumuman,
  getPengumumanAktif,
  getPengumumanById,
  createPengumuman,
  updatePengumuman,
  deletePengumuman,
};
