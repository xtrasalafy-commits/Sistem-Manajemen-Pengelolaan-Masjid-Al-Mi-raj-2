const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');

const ALLOWED_SORT = ['nama', 'kode', 'kategori', 'jumlah', 'kondisi', 'tanggal_beli', 'harga_beli'];

const mapInput = (b) => ({
  nama: b.nama,
  kode: b.kode || null,
  kategori: b.kategori || null,
  jumlah: b.jumlah ?? 1,
  satuan: b.satuan || 'unit',
  kondisi: b.kondisi || 'baik',
  tanggalBeli: b.tanggalBeli || null,
  hargaBeli: b.hargaBeli ?? null,
  estimasiNilai: b.estimasiNilai ?? null,
  lokasi: b.lokasi || null,
  sumberDana: b.sumberDana || null,
  keterangan: b.keterangan || null,
});

/**
 * GET /api/inventaris
 */
const getAllInventaris = asyncHandler(async (req, res) => {
  const { search, kategori, kondisi, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['nama', 'kode', 'kategori', 'lokasi'], 1);

  const extra = [];
  let idx = 1 + params.length;
  if (kategori) {
    extra.push(`kategori ILIKE $${idx++}`);
    params.push(`%${kategori}%`);
  }
  if (kondisi) {
    extra.push(`kondisi = $${idx++}`);
    params.push(kondisi);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'nama');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT id, nama, kode, kategori, jumlah, satuan, kondisi, tanggal_beli, harga_beli, estimasi_nilai, lokasi, sumber_dana, keterangan, created_at FROM inventaris ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM inventaris ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  res.status(200).json({
    status: 'success',
    data: {
      inventaris: rows,
      pagination: { page: req.pagination.page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

const getInventarisById = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM inventaris WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw ApiError.notFound('Inventaris tidak ditemukan');
  res.status(200).json({ status: 'success', data: { inventaris: rows[0] } });
});

const createInventaris = asyncHandler(async (req, res) => {
  const i = mapInput(req.body);

  if (i.kode) {
    const dup = await query('SELECT id FROM inventaris WHERE kode = $1', [i.kode]);
    if (dup.rows.length > 0) throw ApiError.conflict('Kode inventaris sudah ada');
  }

  const { rows } = await query(
    `INSERT INTO inventaris (nama, kode, kategori, jumlah, satuan, kondisi, tanggal_beli, harga_beli, estimasi_nilai, lokasi, sumber_dana, keterangan, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [i.nama, i.kode, i.kategori, i.jumlah, i.satuan, i.kondisi, i.tanggalBeli, i.hargaBeli, i.estimasiNilai, i.lokasi, i.sumberDana, i.keterangan, req.user.id]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'inventaris', recordId: rows[0].id, detail: rows[0] }, req);

  res.status(201).json({ status: 'success', message: 'Inventaris ditambahkan', data: { inventaris: rows[0] } });
});

const updateInventaris = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT * FROM inventaris WHERE id = $1', [id]);
  if (existing.length === 0) throw ApiError.notFound('Inventaris tidak ditemukan');

  const before = existing[0];
  const i = mapInput({ ...before, ...req.body });

  const { rows } = await query(
    `UPDATE inventaris
     SET nama = COALESCE($1, nama), kode = COALESCE($2, kode), kategori = COALESCE($3, kategori),
         jumlah = COALESCE($4, jumlah), satuan = COALESCE($5, satuan), kondisi = COALESCE($6, kondisi),
         tanggal_beli = COALESCE($7, tanggal_beli), harga_beli = COALESCE($8, harga_beli),
         estimasi_nilai = COALESCE($9, estimasi_nilai), lokasi = COALESCE($10, lokasi),
         sumber_dana = COALESCE($11, sumber_dana), keterangan = COALESCE($12, keterangan)
     WHERE id = $13 RETURNING *`,
    [i.nama, i.kode, i.kategori, i.jumlah, i.satuan, i.kondisi, i.tanggalBeli, i.hargaBeli, i.estimasiNilai, i.lokasi, i.sumberDana, i.keterangan, id]
  );

  await logAudit({ userId: req.user.id, aksi: 'UPDATE', modul: 'inventaris', recordId: id, detail: { before, after: rows[0] } }, req);

  res.status(200).json({ status: 'success', message: 'Inventaris diperbarui', data: { inventaris: rows[0] } });
});

const deleteInventaris = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, nama, kode FROM inventaris WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('Inventaris tidak ditemukan');
  await query('DELETE FROM inventaris WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'inventaris', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Inventaris dihapus' });
});

/**
 * GET /api/inventaris/statistik
 */
const getStatistikInventaris = asyncHandler(async (_req, res) => {
  const { rows: total } = await query('SELECT COUNT(*)::int as total, COALESCE(SUM(jumlah),0)::int as total_unit, COALESCE(SUM(COALESCE(estimasi_nilai, harga_beli, 0)),0)::numeric as total_nilai FROM inventaris');
  const { rows: kondisi } = await query("SELECT kondisi, COUNT(*)::int as total FROM inventaris GROUP BY kondisi");
  const { rows: kategori } = await query("SELECT kategori, COUNT(*)::int as total, COALESCE(SUM(jumlah),0)::int as unit FROM inventaris GROUP BY kategori ORDER BY total DESC");

  res.status(200).json({
    status: 'success',
    data: {
      total: total[0].total,
      totalUnit: total[0].total_unit,
      totalNilai: Number(total[0].total_nilai),
      perKondisi: kondisi,
      perKategori: kategori,
    },
  });
});

module.exports = { getAllInventaris, getInventarisById, createInventaris, updateInventaris, deleteInventaris, getStatistikInventaris };
