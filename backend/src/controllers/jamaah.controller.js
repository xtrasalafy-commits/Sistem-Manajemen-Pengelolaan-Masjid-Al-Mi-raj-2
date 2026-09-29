const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');

const ALLOWED_SORT = ['nama', 'nik', 'telepon', 'tanggal_bergabung', 'status', 'created_at'];

/** Map body camelCase -> kolom snake_case */
const mapJamaahInput = (b) => ({
  nama: b.nama,
  nik: b.nik || null,
  jenis_kelamin: b.jenisKelamin || null,
  tempat_lahir: b.tempatLahir || null,
  tanggal_lahir: b.tanggalLahir || null,
  telepon: b.telepon || null,
  email: b.email || null,
  alamat: b.alamat || null,
  pekerjaan: b.pekerjaan || null,
  status_pernikahan: b.statusPernikahan || null,
  tanggal_bergabung: b.tanggalBergabung || null,
  status: b.status || 'aktif',
  keterangan: b.keterangan || null,
});

/**
 * GET /api/jamaah - list + search + filter + pagination
 */
const getAllJamaah = asyncHandler(async (req, res) => {
  const { search, jenisKelamin, status, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['nama', 'nik', 'telepon', 'email'], 1);

  const extra = [];
  let idx = 1 + params.length;
  if (jenisKelamin) {
    extra.push(`jenis_kelamin = $${idx++}`);
    params.push(jenisKelamin);
  }
  if (status) {
    extra.push(`status = $${idx++}`);
    params.push(status);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'nama');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT id, user_id, nama, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, telepon, email, alamat, pekerjaan, status_pernikahan, tanggal_bergabung, status, keterangan, created_at FROM jamaah ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM jamaah ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  const { page } = req.pagination;
  res.status(200).json({
    status: 'success',
    data: {
      jamaah: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

/**
 * GET /api/jamaah/:id
 */
const getJamaahById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT j.*, u.email as user_email, u.role as user_role
     FROM jamaah j LEFT JOIN users u ON j.user_id = u.id
     WHERE j.id = $1`,
    [id]
  );
  if (rows.length === 0) {
    throw ApiError.notFound('Jamaah tidak ditemukan');
  }
  res.status(200).json({ status: 'success', data: { jamaah: rows[0] } });
});

/**
 * POST /api/jamaah  (admin, pengurus)
 */
const createJamaah = asyncHandler(async (req, res) => {
  const input = mapJamaahInput(req.body);

  if (input.nik) {
    const dup = await query('SELECT id FROM jamaah WHERE nik = $1', [input.nik]);
    if (dup.rows.length > 0) throw ApiError.conflict('NIK sudah terdaftar');
  }

  const { rows } = await query(
    `INSERT INTO jamaah (user_id, nama, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, telepon, email, alamat, pekerjaan, status_pernikahan, tanggal_bergabung, status, keterangan)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, CURRENT_DATE), $13, $14)
     RETURNING *`,
    [req.body.userId || null, input.nama, input.nik, input.jenis_kelamin, input.tempat_lahir, input.tanggal_lahir, input.telepon, input.email, input.alamat, input.pekerjaan, input.status_pernikahan, input.tanggal_bergabung, input.status, input.keterangan]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'jamaah', recordId: rows[0].id, detail: rows[0] }, req);

  res.status(201).json({ status: 'success', message: 'Data jamaah ditambahkan', data: { jamaah: rows[0] } });
});

/**
 * PUT /api/jamaah/:id  (admin, pengurus)
 */
const updateJamaah = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existingRows } = await query('SELECT * FROM jamaah WHERE id = $1', [id]);
  if (existingRows.length === 0) {
    throw ApiError.notFound('Jamaah tidak ditemukan');
  }

  const before = existingRows[0];
  const input = mapJamaahInput({ ...req.body, status: req.body.status || before.status });

  const { rows } = await query(
    `UPDATE jamaah
     SET nama = COALESCE($1, nama),
         nik = COALESCE($2, nik),
         jenis_kelamin = COALESCE($3, jenis_kelamin),
         tempat_lahir = COALESCE($4, tempat_lahir),
         tanggal_lahir = COALESCE($5, tanggal_lahir),
         telepon = COALESCE($6, telepon),
         email = COALESCE($7, email),
         alamat = COALESCE($8, alamat),
         pekerjaan = COALESCE($9, pekerjaan),
         status_pernikahan = COALESCE($10, status_pernikahan),
         tanggal_bergabung = COALESCE($11, tanggal_bergabung),
         status = COALESCE($12, status),
         keterangan = COALESCE($13, keterangan)
     WHERE id = $14
     RETURNING *`,
    [input.nama, input.nik, input.jenis_kelamin, input.tempat_lahir, input.tanggal_lahir, input.telepon, input.email, input.alamat, input.pekerjaan, input.status_pernikahan, input.tanggal_bergabung, input.status, input.keterangan, id]
  );

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'jamaah', recordId: id, detail: { before, after: rows[0] } }, req);

  res.status(200).json({ status: 'success', message: 'Data jamaah diperbarui', data: { jamaah: rows[0] } });
});

/**
 * DELETE /api/jamaah/:id  (admin only)
 */
const deleteJamaah = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, nama, nik FROM jamaah WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw ApiError.notFound('Jamaah tidak ditemukan');
  }
  await query('DELETE FROM jamaah WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'jamaah', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Data jamaah dihapus' });
});

/**
 * GET /api/jamaah/statistik  -> dipakai dashboard
 */
const getStatistikJamaah = asyncHandler(async (_req, res) => {
  const total = await query('SELECT COUNT(*)::int as total FROM jamaah');
  const aktif = await query("SELECT COUNT(*)::int as total FROM jamaah WHERE status = 'aktif'");
  const laki = await query("SELECT COUNT(*)::int as total FROM jamaah WHERE jenis_kelamin = 'laki-laki'");
  const perempuan = await query("SELECT COUNT(*)::int as total FROM jamaah WHERE jenis_kelamin = 'perempuan'");
  const bulanIni = await query(
    `SELECT COUNT(*)::int as total FROM jamaah
     WHERE DATE_TRUNC('month', tanggal_bergabung) = DATE_TRUNC('month', CURRENT_DATE)`
  );

  res.status(200).json({
    status: 'success',
    data: {
      total: total.rows[0].total,
      aktif: aktif.rows[0].total,
      nonaktif: total.rows[0].total - aktif.rows[0].total,
      lakiLaki: laki.rows[0].total,
      perempuan: perempuan.rows[0].total,
      bulanIni: bulanIni.rows[0].total,
    },
  });
});

module.exports = { getAllJamaah, getJamaahById, createJamaah, updateJamaah, deleteJamaah, getStatistikJamaah };
