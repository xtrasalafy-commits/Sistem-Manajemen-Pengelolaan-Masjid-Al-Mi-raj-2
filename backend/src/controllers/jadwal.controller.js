const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../utils/audit');

const URUTAN_SHOLAT = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat'];

/**
 * GET /api/jadwal
 * Query: tanggal (ISO, default hari ini), kota, bulan (YYYY-MM)
 */
const getAllJadwal = asyncHandler(async (req, res) => {
  const { tanggal, kota, bulan } = req.query;

  if (bulan) {
    // Ambil jadwal sebulan penuh untuk kalender
    const { rows } = await query(
      `SELECT * FROM jadwal_sholat
       WHERE DATE_TRUNC('month', tanggal) = TO_DATE($1, 'YYYY-MM')
       ${kota ? 'AND kota = $2' : ''}
       ORDER BY tanggal ASC,
         CASE sholat ${URUTAN_SHOLAT.map((s, i) => `WHEN '${s}' THEN ${i}`).join(' ')} END ASC`,
      kota ? [bulan, kota] : [bulan]
    );
    return res.status(200).json({ status: 'success', data: { jadwal: rows } });
  }

  const tgl = tanggal || 'CURRENT_DATE';
  const params = [];
  let i = 1;
  if (tanggal) params.push(tanggal);
  if (kota) params.push(kota);

  const { rows } = await query(
    `SELECT * FROM jadwal_sholat
     WHERE tanggal = ${tanggal ? `$${i++}` : 'CURRENT_DATE'}
     ${kota ? `AND kota = $${i}` : ''}
     ORDER BY
       CASE sholat ${URUTAN_SHOLAT.map((s, idx) => `WHEN '${s}' THEN ${idx}`).join(' ')} END ASC`,
    params
  );

  res.status(200).json({ status: 'success', data: { jadwal: rows } });
});

/**
 * GET /api/jadwal/today  -> dipakai dashboard & halaman publik
 */
const getJadwalToday = asyncHandler(async (req, res) => {
  const kota = req.query.kota || 'Jakarta';
  const { rows } = await query(
    `SELECT * FROM jadwal_sholat
     WHERE tanggal = CURRENT_DATE AND kota = $1
     ORDER BY
       CASE sholat ${URUTAN_SHOLAT.map((s, idx) => `WHEN '${s}' THEN ${idx}`).join(' ')} END ASC`,
    [kota]
  );
  res.status(200).json({ status: 'success', data: { jadwal: rows } });
});

/**
 * GET /api/jadwal/:id
 */
const getJadwalById = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM jadwal_sholat WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw ApiError.notFound('Jadwal tidak ditemukan');
  res.status(200).json({ status: 'success', data: { jadwal: rows[0] } });
});

/**
 * POST /api/jadwal  (admin, pengurus)
 */
const createJadwal = asyncHandler(async (req, res) => {
  const { tanggal, sholat, waktu, kota = 'Jakarta', imam, khotib, keterangan } = req.body;

  const dup = await query(
    'SELECT id FROM jadwal_sholat WHERE tanggal = $1 AND sholat = $2 AND kota = $3',
    [tanggal, sholat, kota]
  );
  if (dup.rows.length > 0) {
    throw ApiError.conflict(`Jadwal ${sholat} untuk tanggal & kota tersebut sudah ada`);
  }

  const { rows } = await query(
    `INSERT INTO jadwal_sholat (tanggal, sholat, waktu, kota, imam, khotib, keterangan, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [tanggal, sholat, waktu, kota, imam || null, khotib || null, keterangan || null, req.user.id]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'jadwal_sholat', recordId: rows[0].id, detail: rows[0] }, req);

  res.status(201).json({ status: 'success', message: 'Jadwal sholat ditambahkan', data: { jadwal: rows[0] } });
});

/**
 * POST /api/jadwal/bulk  (admin, pengurus)
 * Body: { kota, imam, khotib, items: [{ tanggal, sholat, waktu }] }
 * Berguna untuk input jadwal 1 bulan sekaligus.
 */
const bulkCreateJadwal = asyncHandler(async (req, res) => {
  const { items, kota = 'Jakarta', imam, khotib } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('items wajib berupa array berisi minimal 1 item');
  }

  const inserted = [];
  const skipped = [];

  for (const item of items) {
    const { tanggal, sholat, waktu } = item;
    if (!tanggal || !sholat || !waktu) {
      skipped.push({ item, reason: 'field tidak lengkap' });
      continue;
    }
    try {
      const { rows } = await query(
        `INSERT INTO jadwal_sholat (tanggal, sholat, waktu, kota, imam, khotib, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tanggal, sholat, kota) DO NOTHING
         RETURNING *`,
        [tanggal, sholat, waktu, kota, imam || null, khotib || null, req.user.id]
      );
      if (rows.length > 0) inserted.push(rows[0]);
      else skipped.push({ item, reason: 'sudah ada' });
    } catch (err) {
      skipped.push({ item, reason: err.message });
    }
  }

  await logAudit(
    { userId: req.user.id, aksi: 'CREATE', modul: 'jadwal_sholat', detail: { inserted: inserted.length, skipped: skipped.length } },
    req
  );

  res.status(201).json({
    status: 'success',
    message: `${inserted.length} jadwal ditambahkan, ${skipped.length} dilewati`,
    data: { inserted, skipped },
  });
});

/**
 * PUT /api/jadwal/:id  (admin, pengurus)
 */
const updateJadwal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT * FROM jadwal_sholat WHERE id = $1', [id]);
  if (existing.length === 0) throw ApiError.notFound('Jadwal tidak ditemukan');

  const before = existing[0];
  const { tanggal, sholat, waktu, kota, imam, khotib, keterangan } = req.body;

  const { rows } = await query(
    `UPDATE jadwal_sholat
     SET tanggal = COALESCE($1, tanggal),
         sholat = COALESCE($2, sholat),
         waktu = COALESCE($3, waktu),
         kota = COALESCE($4, kota),
         imam = COALESCE($5, imam),
         khotib = COALESCE($6, khotib),
         keterangan = COALESCE($7, keterangan)
     WHERE id = $8
     RETURNING *`,
    [tanggal || null, sholat || null, waktu || null, kota || null, imam ?? null, khotib ?? null, keterangan ?? null, id]
  );

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'jadwal_sholat', recordId: id, detail: { before, after: rows[0] } }, req);

  res.status(200).json({ status: 'success', message: 'Jadwal diperbarui', data: { jadwal: rows[0] } });
});

/**
 * DELETE /api/jadwal/:id  (admin only)
 */
const deleteJadwal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, tanggal, sholat FROM jadwal_sholat WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('Jadwal tidak ditemukan');
  await query('DELETE FROM jadwal_sholat WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'jadwal_sholat', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Jadwal dihapus' });
});

module.exports = {
  getAllJadwal,
  getJadwalToday,
  getJadwalById,
  createJadwal,
  bulkCreateJadwal,
  updateJadwal,
  deleteJadwal,
};
