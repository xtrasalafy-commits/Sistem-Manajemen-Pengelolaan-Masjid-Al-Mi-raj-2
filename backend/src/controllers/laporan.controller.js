const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildSearchFilter, buildSortClause, paginateQuery } = require('../utils/dbHelpers');
const { logAudit } = require('../utils/audit');
const { generateExcel, generatePdf, setDownloadHeaders } = require('../services/export.service');
const { JENIS_LAPORAN } = require('../validators/laporan.validator');

const ALLOWED_SORT = ['judul', 'jenis', 'periode_mulai', 'created_at'];
const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);

/** Ambil data laporan sesuai jenis + periode. */
const ambilDataLaporan = async (jenis, periodeMulai, periodeSelesai) => {
  const range = [periodeMulai, periodeSelesai];

  switch (jenis) {
    case 'keuangan': {
      const { rows } = await query(
        `SELECT jenis, kategori, jumlah, tanggal, metode, keterangan
         FROM keuangan WHERE tanggal BETWEEN $1 AND $2 ORDER BY tanggal ASC`,
        range
      );
      const { rows: s } = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END),0)::numeric as masuk,
           COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END),0)::numeric as keluar
         FROM keuangan WHERE tanggal BETWEEN $1 AND $2`,
        range
      );
      return {
        title: 'Laporan Keuangan',
        columns: ['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Metode', 'Keterangan'],
        rows: rows.map((r) => [
          new Date(r.tanggal).toLocaleDateString('id-ID'),
          r.jenis,
          r.kategori,
          formatRupiah(r.jumlah),
          r.metode,
          (r.keterangan || '-').slice(0, 40),
        ]),
        summary: [
          { label: 'Total Pemasukan', value: formatRupiah(s[0].masuk) },
          { label: 'Total Pengeluaran', value: formatRupiah(s[0].keluar) },
          { label: 'Saldo', value: formatRupiah(Number(s[0].masuk) - Number(s[0].keluar)) },
        ],
        recordCount: rows.length,
      };
    }

    case 'jamaah': {
      const { rows } = await query(
        `SELECT nama, nik, jenis_kelamin, telepon, alamat, pekerjaan, tanggal_bergabung, status
         FROM jamaah WHERE tanggal_bergabung BETWEEN $1 AND $2
         UNION
         SELECT nama, nik, jenis_kelamin, telepon, alamat, pekerjaan, tanggal_bergabung, status
         FROM jamaah WHERE tanggal_bergabung < $1
         ORDER BY nama ASC`,
        range
      );
      return {
        title: 'Laporan Data Jamaah',
        columns: ['Nama', 'NIK', 'Jenis Kelamin', 'Telepon', 'Pekerjaan', 'Bergabung', 'Status'],
        rows: rows.map((r) => [
          r.nama,
          r.nik || '-',
          r.jenis_kelamin || '-',
          r.telepon || '-',
          r.pekerjaan || '-',
          r.tanggal_bergabung ? new Date(r.tanggal_bergabung).toLocaleDateString('id-ID') : '-',
          r.status,
        ]),
        summary: [{ label: 'Total Jamaah', value: String(rows.length) }],
        recordCount: rows.length,
      };
    }

    case 'kegiatan': {
      const { rows } = await query(
        `SELECT judul, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, status
         FROM kegiatan WHERE tanggal_mulai::date BETWEEN $1 AND $2 ORDER BY tanggal_mulai ASC`,
        range
      );
      return {
        title: 'Laporan Kegiatan Masjid',
        columns: ['Judul', 'Kategori', 'Mulai', 'Selesai', 'Lokasi', 'PIC', 'Status'],
        rows: rows.map((r) => [
          r.judul,
          r.kategori,
          new Date(r.tanggal_mulai).toLocaleString('id-ID'),
          r.tanggal_selesai ? new Date(r.tanggal_selesai).toLocaleString('id-ID') : '-',
          r.lokasi,
          r.pic || '-',
          r.status,
        ]),
        summary: [{ label: 'Total Kegiatan', value: String(rows.length) }],
        recordCount: rows.length,
      };
    }

    case 'inventaris': {
      const { rows } = await query(
        `SELECT nama, kode, kategori, jumlah, satuan, kondisi, tanggal_beli, harga_beli, lokasi
         FROM inventaris ORDER BY nama ASC`
      );
      const { rows: s } = await query(
        'SELECT COALESCE(SUM(COALESCE(estimasi_nilai, harga_beli, 0)),0)::numeric as total, COALESCE(SUM(jumlah),0)::int as unit FROM inventaris'
      );
      return {
        title: 'Laporan Inventaris / Aset',
        columns: ['Nama', 'Kode', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Tgl Beli', 'Harga', 'Lokasi'],
        rows: rows.map((r) => [
          r.nama,
          r.kode || '-',
          r.kategori || '-',
          String(r.jumlah),
          r.satuan,
          r.kondisi,
          r.tanggal_beli ? new Date(r.tanggal_beli).toLocaleDateString('id-ID') : '-',
          r.harga_beli ? formatRupiah(r.harga_beli) : '-',
          r.lokasi || '-',
        ]),
        summary: [
          { label: 'Total Item', value: String(rows.length) },
          { label: 'Total Unit', value: String(s[0].unit) },
          { label: 'Total Nilai', value: formatRupiah(s[0].total) },
        ],
        recordCount: rows.length,
      };
    }

    default: {
      // umum: ringkasan seluruh modul
      const q = async (sql) => (await query(sql)).rows;
      const [users, jamaah, kegiatan, keuangan, inventaris, pengumuman] = await Promise.all([
        q('SELECT COUNT(*)::int as c FROM users'),
        q('SELECT COUNT(*)::int as c FROM jamaah'),
        q('SELECT COUNT(*)::int as c FROM kegiatan'),
        q(`SELECT
             COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END),0)::numeric as masuk,
             COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END),0)::numeric as keluar
           FROM keuangan WHERE tanggal BETWEEN $1 AND $2`, range),
        q('SELECT COUNT(*)::int as c, COALESCE(SUM(COALESCE(estimasi_nilai,harga_beli,0)),0)::numeric as nilai FROM inventaris'),
        q('SELECT COUNT(*)::int as c FROM pengumuman'),
      ]);

      return {
        title: 'Laporan Umum Masjid',
        columns: ['Modul', 'Ringkasan', 'Keterangan'],
        rows: [
          ['User', String(users[0].c), 'Seluruh akun terdaftar'],
          ['Jamaah', String(jamaah[0].c), 'Anggota jamaah'],
          ['Kegiatan', String(kegiatan[0].c), 'Seluruh kegiatan'],
          ['Pemasukan', formatRupiah(keuangan[0].masuk), `Periode ${periodeMulai} s/d ${periodeSelesai}`],
          ['Pengeluaran', formatRupiah(keuangan[0].keluar), `Periode ${periodeMulai} s/d ${periodeSelesai}`],
          ['Saldo', formatRupiah(Number(keuangan[0].masuk) - Number(keuangan[0].keluar)), 'Pemasukan - Pengeluaran'],
          ['Inventaris', String(inventaris[0].c), `Nilai estimasi ${formatRupiah(inventaris[0].nilai)}`],
          ['Pengumuman', String(pengumuman[0].c), 'Seluruh pengumuman'],
        ],
        summary: [{ label: 'Periode', value: `${periodeMulai} s/d ${periodeSelesai}` }],
        recordCount: 8,
      };
    }
  }
};

/**
 * GET /api/laporan
 */
const getAllLaporan = asyncHandler(async (req, res) => {
  const { search, jenis, sortBy, sortOrder } = req.query;
  const { limit, offset } = req.pagination;

  const { where: searchWhere, params } = buildSearchFilter(search, ['judul'], 1);
  const extra = [];
  let idx = 1 + params.length;
  if (jenis) {
    extra.push(`jenis = $${idx++}`);
    params.push(jenis);
  }
  const where = [searchWhere, extra.length ? `WHERE ${extra.join(' AND ')}` : ''].filter(Boolean).join(' AND ');
  const sort = buildSortClause(sortBy, ALLOWED_SORT, sortOrder, 'created_at', 'desc');

  const { rows, total } = await paginateQuery({
    dataQuery: `SELECT l.id, l.judul, l.jenis, l.periode_mulai, l.periode_selesai, l.ringkasan, l.file_url, l.created_at, u.nama as dibuat_oleh
                FROM laporan l LEFT JOIN users u ON l.created_by = u.id
                ${where} ${sort}`,
    countQuery: `SELECT COUNT(*) FROM laporan l ${where}`,
    params,
    limit,
    offset,
    startParamIndex: idx,
  });

  res.status(200).json({
    status: 'success',
    data: {
      laporan: rows,
      pagination: { page: req.pagination.page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

const getLaporanById = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT l.*, u.nama as dibuat_oleh FROM laporan l LEFT JOIN users u ON l.created_by = u.id WHERE l.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw ApiError.notFound('Laporan tidak ditemukan');
  res.status(200).json({ status: 'success', data: { laporan: rows[0] } });
});

/**
 * POST /api/laporan  - simpan metadata laporan
 */
const createLaporan = asyncHandler(async (req, res) => {
  const { judul, jenis, periodeMulai, periodeSelesai, ringkasan, fileUrl } = req.body;

  if (!JENIS_LAPORAN.includes(jenis)) throw ApiError.badRequest('Jenis laporan tidak valid');

  const { rows } = await query(
    `INSERT INTO laporan (judul, jenis, periode_mulai, periode_selesai, ringkasan, file_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [judul, jenis, periodeMulai, periodeSelesai, ringkasan || null, fileUrl || null, req.user.id]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'laporan', recordId: rows[0].id, detail: rows[0] }, req);

  res.status(201).json({ status: 'success', message: 'Laporan disimpan', data: { laporan: rows[0] } });
});

/**
 * DELETE /api/laporan/:id
 */
const deleteLaporan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, judul FROM laporan WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('Laporan tidak ditemukan');
  await query('DELETE FROM laporan WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'laporan', recordId: id, detail: { deleted: rows[0] } }, req);
  res.status(200).json({ status: 'success', message: 'Laporan dihapus' });
});

/**
 * POST /api/laporan/generate
 * Body: { jenis, format: 'xlsx'|'pdf', periodeMulai, periodeSelesai, save: bool, judul }
 * Menghasilkan file download, dan (opsional) menyimpan record laporan.
 */
const generateLaporan = asyncHandler(async (req, res) => {
  const { jenis = 'umum', format = 'xlsx', periodeMulai, periodeSelesai, save = false, judul } = req.body;

  if (!JENIS_LAPORAN.includes(jenis)) throw ApiError.badRequest('Jenis laporan tidak valid');
  if (!periodeMulai || !periodeSelesai) throw ApiError.badRequest('periodeMulai & periodeSelesai wajib diisi');

  const data = await ambilDataLaporan(jenis, periodeMulai, periodeSelesai);
  const subtitle = `Periode ${periodeMulai} s/d ${periodeSelesai} • ${data.recordCount} data • Dibuat ${new Date().toLocaleDateString('id-ID')}`;

  await logAudit(
    { userId: req.user.id, aksi: 'EXPORT', modul: 'laporan', detail: { jenis, format, periodeMulai, periodeSelesai } },
    req
  );

  if (save) {
    const finalJudul = judul || `${data.title} ${periodeMulai} s/d ${periodeSelesai}`;
    await query(
      `INSERT INTO laporan (judul, jenis, periode_mulai, periode_selesai, ringkasan, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [finalJudul, jenis, periodeMulai, periodeSelesai, `${data.recordCount} data`, req.user.id]
    );
  }

  if (format === 'pdf') {
    const buffer = await generatePdf({
      title: data.title,
      subtitle,
      columns: data.columns,
      rows: data.rows,
      summary: data.summary,
    });
    setDownloadHeaders(res, { filename: `${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`, mime: 'application/pdf' });
    return res.send(buffer);
  }

  const buffer = await generateExcel({
    title: data.title,
    subtitle,
    columns: data.columns,
    rows: data.rows,
    sheetName: data.title.slice(0, 28),
  });
  setDownloadHeaders(res, {
    filename: `${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  res.send(Buffer.from(buffer));
});

module.exports = {
  getAllLaporan,
  getLaporanById,
  createLaporan,
  deleteLaporan,
  generateLaporan,
};
