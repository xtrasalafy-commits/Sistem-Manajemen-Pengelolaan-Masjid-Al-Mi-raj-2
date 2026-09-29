const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');

const ALLOWED_SORT = ['tanggal_mulai', 'judul', 'kategori', 'status', 'created_at'];

/**
 * GET /api/kegiatan
 * Query: search, kategori, status, bulan (YYYY-MM), page, limit
 */
const getAllKegiatan = asyncHandler(async (req, res) => {
  const { search, kategori, status, bulan, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['judul', 'deskripsi', 'lokasi'], 1);

  const extra = [];
  let idx = 1 + params.length;
  if (kategori) {
    extra.push(`kategori = $${idx++}`);
    params.push(kategori);
  }
  if (status) {
    extra.push(`status = $${idx++}`);
    params.push(status);
  }
  if (bulan) {
    extra.push(`DATE_TRUNC('month', tanggal_mulai) = TO_DATE($${idx++}, 'YYYY-MM')`);
    params.push(bulan);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'tanggal_mulai');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT id, judul, deskripsi, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, gambar_url, status, created_at FROM kegiatan ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM kegiatan ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  const { page } = req.pagination;
  res.status(200).json({
    status: 'success',
    data: {
      kegiatan: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

/**
 * GET /api/kegiatan/calendar?bulan=YYYY-MM  -> data untuk calendar view
 */
const getKegiatanCalendar = asyncHandler(async (req, res) => {
  const bulan = req.query.bulan || new Date().toISOString().slice(0, 7);
  const { rows } = await query(
    `SELECT id, judul, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, status, gambar_url
     FROM kegiatan
     WHERE DATE_TRUNC('month', tanggal_mulai) = TO_DATE($1, 'YYYY-MM')
        OR DATE_TRUNC('month', tanggal_selesai) = TO_DATE($1, 'YYYY-MM')
     ORDER BY tanggal_mulai ASC`,
    [bulan]
  );
  res.status(200).json({ status: 'success', data: { kegiatan: rows } });
});

/**
 * GET /api/kegiatan/berlangsung  -> kegiatan upcoming/berlangsung (dashboard)
 */
const getKegiatanBerlangsung = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, judul, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, status, gambar_url
     FROM kegiatan
     WHERE status IN ('direncanakan', 'berlangsung')
       AND tanggal_mulai >= NOW() - INTERVAL '30 days'
     ORDER BY tanggal_mulai ASC
     LIMIT 5`
  );
  res.status(200).json({ status: 'success', data: { kegiatan: rows } });
});

/**
 * GET /api/kegiatan/:id
 */
const getKegiatanById = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT k.*, u.nama as dibuat_oleh
     FROM kegiatan k LEFT JOIN users u ON k.created_by = u.id
     WHERE k.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw ApiError.notFound('Kegiatan tidak ditemukan');
  res.status(200).json({ status: 'success', data: { kegiatan: rows[0] } });
});

/**
 * POST /api/kegiatan  (admin, pengurus)
 */
const createKegiatan = asyncHandler(async (req, res) => {
  const { judul, deskripsi, kategori = 'lainnya', tanggalMulai, tanggalSelesai, lokasi, pic, gambarUrl, status = 'direncanakan' } = req.body;

  const { rows } = await query(
    `INSERT INTO kegiatan (judul, deskripsi, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, gambar_url, status, created_by)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Masjid Al-Mi''raj'), $7, $8, $9, $10)
     RETURNING *`,
    [judul, deskripsi || null, kategori, tanggalMulai, tanggalSelesai || null, lokasi || null, pic || null, gambarUrl || null, status, req.user.id]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'kegiatan', recordId: rows[0].id, detail: rows[0] }, req);

  res.status(201).json({ status: 'success', message: 'Kegiatan ditambahkan', data: { kegiatan: rows[0] } });
});

/**
 * PUT /api/kegiatan/:id  (admin, pengurus)
 */
const updateKegiatan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT * FROM kegiatan WHERE id = $1', [id]);
  if (existing.length === 0) throw ApiError.notFound('Kegiatan tidak ditemukan');

  const before = existing[0];
  const { judul, deskripsi, kategori, tanggalMulai, tanggalSelesai, lokasi, pic, gambarUrl, status } = req.body;

  const { rows } = await query(
    `UPDATE kegiatan
     SET judul = COALESCE($1, judul),
         deskripsi = COALESCE($2, deskripsi),
         kategori = COALESCE($3, kategori),
         tanggal_mulai = COALESCE($4, tanggal_mulai),
         tanggal_selesai = COALESCE($5, tanggal_selesai),
         lokasi = COALESCE($6, lokasi),
         pic = COALESCE($7, pic),
         gambar_url = COALESCE($8, gambar_url),
         status = COALESCE($9, status)
     WHERE id = $10
     RETURNING *`,
    [judul || null, deskripsi ?? null, kategori || null, tanggalMulai || null, tanggalSelesai ?? null, lokasi || null, pic ?? null, gambarUrl ?? null, status || null, id]
  );

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'kegiatan', recordId: id, detail: { before, after: rows[0] } }, req);

  res.status(200).json({ status: 'success', message: 'Kegiatan diperbarui', data: { kegiatan: rows[0] } });
});

/**
 * DELETE /api/kegiatan/:id  (admin only)
 */
const deleteKegiatan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, judul FROM kegiatan WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('Kegiatan tidak ditemukan');
  await query('DELETE FROM kegiatan WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'kegiatan', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Kegiatan dihapus' });
});

module.exports = {
  getAllKegiatan,
  getKegiatanCalendar,
  getKegiatanBerlangsung,
  getKegiatanById,
  createKegiatan,
  updateKegiatan,
  deleteKegiatan,
};
