const { query, transaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');
const { generateExcel, generatePdf, setDownloadHeaders } = require('../services/export.service');
const { JENIS_TRANSAKSI } = require('../validators/keuangan.validator');

const ALLOWED_SORT = ['tanggal', 'jumlah', 'jenis', 'kategori', 'created_at'];

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

/**
 * GET /api/keuangan
 * Query: search, jenis, kategori, tanggalMulai, tanggalSelesai, bulan, page, limit
 */
const getAllKeuangan = asyncHandler(async (req, res) => {
  const { search, jenis, kategori, tanggalMulai, tanggalSelesai, bulan, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['kategori', 'keterangan'], 1);

  const extra = [];
  let idx = 1 + params.length;
  if (jenis) {
    extra.push(`jenis = $${idx++}`);
    params.push(jenis);
  }
  if (kategori) {
    extra.push(`kategori ILIKE $${idx++}`);
    params.push(`%${kategori}%`);
  }
  if (tanggalMulai) {
    extra.push(`tanggal >= $${idx++}`);
    params.push(tanggalMulai);
  }
  if (tanggalSelesai) {
    extra.push(`tanggal <= $${idx++}`);
    params.push(tanggalSelesai);
  }
  if (bulan) {
    extra.push(`DATE_TRUNC('month', tanggal) = TO_DATE($${idx++}, 'YYYY-MM')`);
    params.push(bulan);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'tanggal');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT id, jenis, kategori, jumlah, tanggal, keterangan, bukti_file_url, metode, created_by, created_at FROM keuangan ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM keuangan ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  // Ringkasan sesuai filter yang sama (tanpa pagination)
  const { rows: summaryRows } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END), 0)::numeric as total_masuk,
       COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0)::numeric as total_keluar
     FROM keuangan ${where}`,
    params
  );
  const s = summaryRows[0];
  const { page } = req.pagination;

  res.status(200).json({
    status: 'success',
    data: {
      transaksi: rows,
      ringkasan: {
        totalMasuk: Number(s.total_masuk),
        totalKeluar: Number(s.total_keluar),
        saldo: Number(s.total_masuk) - Number(s.total_keluar),
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

/**
 * GET /api/keuangan/statistik  -> dipakai dashboard
 * Query: tahun (default tahun berjalan)
 */
const getStatistikKeuangan = asyncHandler(async (req, res) => {
  const tahun = req.query.tahun || String(new Date().getFullYear());

  const { rows: yearly } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END), 0)::numeric as total_masuk,
       COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0)::numeric as total_keluar
     FROM keuangan WHERE DATE_TRUNC('year', tanggal) = TO_DATE($1, 'YYYY')`,
    [tahun]
  );

  const { rows: bulanan } = await query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', tanggal), 'YYYY-MM') as bulan,
       COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END), 0)::numeric as masuk,
       COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0)::numeric as keluar
     FROM keuangan
     WHERE DATE_TRUNC('year', tanggal) = TO_DATE($1, 'YYYY')
     GROUP BY 1 ORDER BY 1 ASC`,
    [tahun]
  );

  const { rows: kategoriRows } = await query(
    `SELECT kategori,
            COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END), 0)::numeric as masuk,
            COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0)::numeric as keluar
     FROM keuangan
     WHERE DATE_TRUNC('year', tanggal) = TO_DATE($1, 'YYYY')
     GROUP BY kategori ORDER BY (masuk + keluar) DESC`,
    [tahun]
  );

  const y = yearly[0];
  const totalMasuk = Number(y.total_masuk);
  const totalKeluar = Number(y.total_keluar);

  res.status(200).json({
    status: 'success',
    data: {
      totalMasuk,
      totalKeluar,
      saldo: totalMasuk - totalKeluar,
      tahun,
      bulanan: bulanan.map((b) => ({ bulan: b.bulan, masuk: Number(b.masuk), keluar: Number(b.keluar) })),
      perKategori: kategoriRows.map((k) => ({
        kategori: k.kategori,
        masuk: Number(k.masuk),
        keluar: Number(k.keluar),
      })),
    },
  });
});

/**
 * POST /api/keuangan  (admin, pengurus)
 */
const createKeuangan = asyncHandler(async (req, res) => {
  const { jenis, kategori, jumlah, tanggal, keterangan, metode = 'tunai', buktiFileUrl } = req.body;

  if (!JENIS_TRANSAKSI.includes(jenis)) {
    throw ApiError.badRequest('Jenis transaksi tidak valid');
  }

  const { rows } = await query(
    `INSERT INTO keuangan (jenis, kategori, jumlah, tanggal, keterangan, bukti_file_url, metode, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [jenis, kategori, jumlah, tanggal, keterangan || null, buktiFileUrl || null, metode, req.user.id]
  );

  const trx = rows[0];
  await logAudit(
    { userId: req.user.id, aksi: 'CREATE', modul: 'keuangan', recordId: trx.id, detail: { after: trx } },
    req
  );

  res.status(201).json({ status: 'success', message: 'Transaksi keuangan ditambahkan', data: { transaksi: trx } });
});

/**
 * PUT /api/keuangan/:id  (admin, pengurus)
 */
const updateKeuangan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT * FROM keuangan WHERE id = $1', [id]);
  if (existing.length === 0) throw ApiError.notFound('Transaksi tidak ditemukan');

  const before = existing[0];
  const { jenis, kategori, jumlah, tanggal, keterangan, metode, buktiFileUrl } = req.body;

  const { rows } = await query(
    `UPDATE keuangan
     SET jenis = COALESCE($1, jenis),
         kategori = COALESCE($2, kategori),
         jumlah = COALESCE($3, jumlah),
         tanggal = COALESCE($4, tanggal),
         keterangan = COALESCE($5, keterangan),
         metode = COALESCE($6, metode),
         bukti_file_url = COALESCE($7, bukti_file_url)
     WHERE id = $8
     RETURNING *`,
    [jenis || null, kategori || null, jumlah ?? null, tanggal || null, keterangan ?? null, metode || null, buktiFileUrl ?? null, id]
  );

  await logAudit(
    { userId: req.user.id, aksi: 'UPDATE', modul: 'keuangan', recordId: id, detail: { before, after: rows[0] } },
    req
  );

  res.status(200).json({ status: 'success', message: 'Transaksi diperbarui', data: { transaksi: rows[0] } });
});

/**
 * DELETE /api/keuangan/:id  (admin only)
 */
const deleteKeuangan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, jenis, kategori, jumlah, tanggal FROM keuangan WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('Transaksi tidak ditemukan');
  await query('DELETE FROM keuangan WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'keuangan', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Transaksi dihapus' });
});

/**
 * GET /api/keuangan/export?format=xlsx|pdf  (admin, pengurus)
 */
const exportKeuangan = asyncHandler(async (req, res) => {
  const format = (req.query.format || 'xlsx').toLowerCase();
  const { jenis, kategori, tanggalMulai, tanggalSelesai } = req.query;

  const conditions = [];
  const params = [];
  let idx = 1;
  if (jenis) {
    conditions.push(`jenis = $${idx++}`);
    params.push(jenis);
  }
  if (kategori) {
    conditions.push(`kategori ILIKE $${idx++}`);
    params.push(`%${kategori}%`);
  }
  if (tanggalMulai) {
    conditions.push(`tanggal >= $${idx++}`);
    params.push(tanggalMulai);
  }
  if (tanggalSelesai) {
    conditions.push(`tanggal <= $${idx++}`);
    params.push(tanggalSelesai);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT jenis, kategori, jumlah, tanggal, metode, keterangan
     FROM keuangan ${where}
     ORDER BY tanggal DESC, created_at DESC`,
    params
  );

  const subtitle = `Periode ${tanggalMulai || 'awal'} s/d ${tanggalSelesai || 'sekarang'} • ${rows.length} transaksi`;

  const { rows: sumRows } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END),0)::numeric as masuk,
       COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END),0)::numeric as keluar
     FROM keuangan ${where}`,
    params
  );
  const sm = sumRows[0];

  await logAudit(
    { userId: req.user.id, aksi: 'EXPORT', modul: 'keuangan', detail: { format, jumlah: rows.length } },
    req
  );

  if (format === 'pdf') {
    const pdfBuffer = await generatePdf({
      title: 'Laporan Keuangan',
      subtitle,
      columns: ['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Metode', 'Keterangan'],
      rows: rows.map((r) => [
        new Date(r.tanggal).toLocaleDateString('id-ID'),
        r.jenis.toUpperCase(),
        r.kategori,
        formatRupiah(r.jumlah),
        r.metode,
        (r.keterangan || '-').slice(0, 40),
      ]),
      summary: [
        { label: 'Total Pemasukan', value: formatRupiah(sm.masuk) },
        { label: 'Total Pengeluaran', value: formatRupiah(sm.keluar) },
        { label: 'Saldo', value: formatRupiah(Number(sm.masuk) - Number(sm.keluar)) },
      ],
    });
    setDownloadHeaders(res, { filename: `laporan-keuangan-${Date.now()}.pdf`, mime: 'application/pdf' });
    return res.send(pdfBuffer);
  }

  const excelBuffer = await generateExcel({
    title: 'Laporan Keuangan',
    subtitle,
    columns: ['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Metode', 'Keterangan'],
    rows: rows.map((r) => [
      new Date(r.tanggal).toLocaleDateString('id-ID'),
      r.jenis,
      r.kategori,
      Number(r.jumlah),
      r.metode,
      r.keterangan || '-',
    ]),
    sheetName: 'Keuangan',
  });

  setDownloadHeaders(res, {
    filename: `laporan-keuangan-${Date.now()}.xlsx`,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  res.send(Buffer.from(excelBuffer));
});

// ===========================================================================
// DONASI
// ===========================================================================

/**
 * GET /api/keuangan/donasi
 */
const getAllDonasi = asyncHandler(async (req, res) => {
  const { search, tanggalMulai, tanggalSelesai } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['nama_donatur', 'tujuan'], 1);
  const extra = [];
  let idx = 1 + params.length;
  if (tanggalMulai) {
    extra.push(`tanggal >= $${idx++}`);
    params.push(tanggalMulai);
  }
  if (tanggalSelesai) {
    extra.push(`tanggal <= $${idx++}`);
    params.push(tanggalSelesai);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT d.id, d.nama_donatur, d.jamaah_id, j.nama as jamaah_nama, d.jumlah, d.tanggal, d.metode, d.tujuan, d.keterangan, d.created_at
                FROM donasi d LEFT JOIN jamaah j ON d.jamaah_id = j.id
                ${where} ORDER BY d.tanggal DESC`,
    countQuery: `SELECT COUNT(*) FROM donasi d ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  const { rows: sum } = await query(`SELECT COALESCE(SUM(jumlah),0)::numeric as total FROM donasi d ${where}`, params);

  res.status(200).json({
    status: 'success',
    data: {
      donasi: rows,
      totalDonasi: Number(sum[0].total),
      pagination: { page: req.pagination.page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

/**
 * POST /api/keuangan/donasi
 * Membuat donasi sekaligus transaksi keuangan (dalam 1 transaction).
 */
const createDonasi = asyncHandler(async (req, res) => {
  const { namaDonatur, jamaahId, jumlah, tanggal, metode = 'tunai', tujuan, keterangan } = req.body;

  const result = await transaction(async (client) => {
    // 1. Buat transaksi keuangan
    const trx = await client.query(
      `INSERT INTO keuangan (jenis, kategori, jumlah, tanggal, keterangan, metode, created_by)
       VALUES ('masuk', 'donasi', $1, $2, $3, $4, $5)
       RETURNING id`,
      [jumlah, tanggal, keterangan || `Donasi ${namaDonatur}${tujuan ? ` - ${tujuan}` : ''}`, metode, req.user.id]
    );
    const transaksiId = trx.rows[0].id;

    // 2. Buat record donasi yang ter-link
    const donasi = await client.query(
      `INSERT INTO donasi (nama_donatur, jamaah_id, jumlah, tanggal, metode, tujuan, keterangan, transaksi_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [namaDonatur, jamaahId || null, jumlah, tanggal, metode, tujuan || null, keterangan || null, transaksiId, req.user.id]
    );

    return donasi.rows[0];
  });

  await logAudit(
    { userId: req.user.id, aksi: 'CREATE', modul: 'donasi', recordId: result.id, detail: { after: result } },
    req
  );

  res.status(201).json({ status: 'success', message: 'Donasi tercatat', data: { donasi: result } });
});

/**
 * DELETE /api/keuangan/donasi/:id  (admin only) - hapus donasi + transaksinya
 */
const deleteDonasi = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await transaction(async (client) => {
    const donasi = await client.query('SELECT id, transaksi_id, nama_donatur, jumlah FROM donasi WHERE id = $1', [id]);
    if (donasi.rows.length === 0) throw ApiError.notFound('Donasi tidak ditemukan');

    const d = donasi.rows[0];
    if (d.transaksi_id) {
      await client.query('DELETE FROM keuangan WHERE id = $1', [d.transaksi_id]);
    }
    await client.query('DELETE FROM donasi WHERE id = $1', [id]);
    return d;
  });

  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'donasi', recordId: id, detail: { deleted: result } }, req);

  res.status(200).json({ status: 'success', message: 'Donasi dihapus beserta transaksinya' });
});

module.exports = {
  getAllKeuangan,
  getStatistikKeuangan,
  createKeuangan,
  updateKeuangan,
  deleteKeuangan,
  exportKeuangan,
  getAllDonasi,
  createDonasi,
  deleteDonasi,
};
