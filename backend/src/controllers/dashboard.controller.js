const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/dashboard  -> statistik ringkas untuk dashboard admin.
 * Menggabungkan beberapa query kecil (paralel) agar 1 request = 1 round trip besar.
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const run = async (sql, params = []) => (await query(sql, params)).rows;

  const [
    jamaah,
    users,
    kegiatan,
    keuanganTahun,
    keuanganBulan,
    pengumuman,
    inventaris,
    donasiBulan,
  ] = await Promise.all([
    run('SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status=$1)::int as aktif FROM jamaah', ['aktif']),
    run("SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE role='admin')::int as admin, COUNT(*) FILTER (WHERE role='pengurus')::int as pengurus FROM users"),
    run("SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status IN ('direncanakan','berlangsung'))::int as upcoming FROM kegiatan"),
    run(`SELECT
           COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END),0)::numeric as masuk,
           COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END),0)::numeric as keluar
         FROM keuangan WHERE DATE_TRUNC('year', tanggal) = DATE_TRUNC('year', CURRENT_DATE)`),
    run(`SELECT
           COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END),0)::numeric as masuk,
           COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END),0)::numeric as keluar
         FROM keuangan WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)`),
    run(`SELECT COUNT(*)::int as total FROM pengumuman
         WHERE status='aktif' AND tanggal_mulai <= CURRENT_DATE AND (tanggal_selesai IS NULL OR tanggal_selesai >= CURRENT_DATE)`),
    run('SELECT COUNT(*)::int as total, COALESCE(SUM(COALESCE(estimasi_nilai, harga_beli, 0)),0)::numeric as nilai FROM inventaris'),
    run(`SELECT COALESCE(SUM(jumlah),0)::numeric as total FROM donasi
         WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)`),
  ]);

  // Chart: pemasukan vs pengeluaran per bulan (tahun berjalan)
  const { rows: chartBulanan } = await query(
    `SELECT TO_CHAR(DATE_TRUNC('month', tanggal), 'YYYY-MM') as bulan,
            COALESCE(SUM(CASE WHEN jenis='masuk' THEN jumlah ELSE 0 END),0)::numeric as masuk,
            COALESCE(SUM(CASE WHEN jenis='keluar' THEN jumlah ELSE 0 END),0)::numeric as keluar
     FROM keuangan
     WHERE DATE_TRUNC('year', tanggal) = DATE_TRUNC('year', CURRENT_DATE)
     GROUP BY 1 ORDER BY 1 ASC`
  );

  // Chart: donasi per kategori
  const { rows: chartDonasi } = await query(
    `SELECT COALESCE(tujuan,'Umum') as tujuan, COALESCE(SUM(jumlah),0)::numeric as total
     FROM donasi
     WHERE DATE_TRUNC('year', tanggal) = DATE_TRUNC('year', CURRENT_DATE)
     GROUP BY 1 ORDER BY total DESC LIMIT 6`
  );

  const masukTahun = Number(keuanganTahun[0].masuk);
  const keluarTahun = Number(keuanganTahun[0].keluar);
  const masukBulan = Number(keuanganBulan[0].masuk);
  const keluarBulan = Number(keuanganBulan[0].keluar);

  res.status(200).json({
    status: 'success',
    data: {
      jamaah: { total: jamaah[0].total, aktif: jamaah[0].aktif },
      users: { total: users[0].total, admin: users[0].admin, pengurus: users[0].pengurus },
      kegiatan: { total: kegiatan[0].total, upcoming: kegiatan[0].upcoming },
      keuangan: {
        tahun: { masuk: masukTahun, keluar: keluarTahun, saldo: masukTahun - keluarTahun },
        bulanIni: { masuk: masukBulan, keluar: keluarBulan, saldo: masukBulan - keluarBulan },
      },
      donasiBulanIni: Number(donasiBulan[0].total),
      pengumumanAktif: pengumuman[0].total,
      inventaris: { total: inventaris[0].total, nilai: Number(inventaris[0].nilai) },
      chartBulanan: chartBulanan.map((c) => ({ bulan: c.bulan, masuk: Number(c.masuk), keluar: Number(c.keluar) })),
      chartDonasi: chartDonasi.map((c) => ({ tujuan: c.tujuan, total: Number(c.total) })),
    },
  });
});

module.exports = { getDashboardStats };
