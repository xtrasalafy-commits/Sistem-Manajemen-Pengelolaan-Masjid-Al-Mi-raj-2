const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');
const logger = require('./logger');

/**
 * Seeder: membuat user dengan role berbeda (password bcrypt) + data contoh.
 * Idempoten: menggunakan ON CONFLICT / pengecekan sehingga aman dijalankan berulang.
 *
 * Akun default (GANTI PASSWORD setelah login pertama!):
 *   admin    : admin@masjidalmiraj.sch.id / admin12345
 *   pengurus : pengurus@masjidalmiraj.sch.id / pengurus12345
 *   jamaah   : jamaah@masjidalmiraj.sch.id / jamaah12345
 */

const DEFAULT_USERS = [
  {
    nama: 'Administrator Masjid',
    email: 'admin@masjidalmiraj.sch.id',
    password: 'admin12345',
    role: 'admin',
    telepon: '081200000001',
    alamat: 'Komplek Masjid Al-Mi\'raj',
  },
  {
    nama: 'Pengurus Harian',
    email: 'pengurus@masjidalmiraj.sch.id',
    password: 'pengurus12345',
    role: 'pengurus',
    telepon: '081200000002',
    alamat: 'Komplek Masjid Al-Mi\'raj',
  },
  {
    nama: 'Jamaah Contoh',
    email: 'jamaah@masjidalmiraj.sch.id',
    password: 'jamaah12345',
    role: 'jamaah',
    telepon: '081200000003',
    alamat: 'Jl. Damai No. 1',
  },
];

const seedUsers = async () => {
  logger.info('👤 seeding users...');
  const created = [];

  for (const u of DEFAULT_USERS) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length > 0) {
      created.push({ email: u.email, status: 'sudah ada' });
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 12);
    const { rows } = await query(
      `INSERT INTO users (nama, email, password, role, telepon, alamat)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nama, email, role`,
      [u.nama, u.email, hashed, u.role, u.telepon, u.alamat]
    );
    created.push({ ...rows[0], status: 'dibuat' });
  }

  return created;
};

const seedJamaah = async (adminId) => {
  logger.info('👥 seeding jamaah...');
  const list = [
    ['Ahmad Fauzi', '3175010101900001', 'laki-laki', 'Jakarta', '1990-01-01', '081234567801', 'ahmad.fauzi@example.com', 'Jl. Kebon Jeruk No. 1, Jakarta Barat', 'Pengusaha', 'menikah', -730],
    ['Muhammad Ridwan', '3175010202850002', 'laki-laki', 'Bandung', '1985-02-02', '081234567802', 'm.ridwan@example.com', 'Jl. Mangga Dua No. 5, Jakarta Pusat', 'Guru', 'menikah', -540],
    ['Siti Aminah', '3175030303920003', 'perempuan', 'Bogor', '1992-03-03', '081234567803', 'siti.aminah@example.com', 'Jl. Melati No. 12, Jakarta Selatan', 'Ibu Rumah Tangga', 'menikah', -365],
    ['Abdul Rohman', '3175040404780004', 'laki-laki', 'Surabaya', '1978-04-04', '081234567804', 'a.rohman@example.com', 'Jl. Kenanga No. 8, Jakarta Timur', 'PNS', 'menikah', -1095],
    ['Nur Hidayah', '3175050505950005', 'perempuan', 'Depok', '1995-05-05', '081234567805', 'nur.hidayah@example.com', 'Jl. Anggrek No. 3, Depok', 'Mahasiswa', 'belum_menikah', -180],
    ['Zakiyah Astuti', '3175070707910007', 'perempuan', 'Solo', '1991-07-07', '081234567807', 'zakiyah.a@example.com', 'Jl. Dahlia No. 9, Tangerang', 'Apoteker', 'menikah', -365],
    ['Yusuf Maulana', '3175080808830008', 'laki-laki', 'Yogyakarta', '1983-08-08', '081234567808', 'yusuf.m@example.com', 'Jl. Cempaka No. 14, Bekasi', 'Arsitek', 'menikah', -730],
  ];

  for (const [nama, nik, jk, tmpLahir, tglLahir, telp, email, alamat, kerja, statusNikah, offsetDays] of list) {
    await query(
      `INSERT INTO jamaah (user_id, nama, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, telepon, email, alamat, pekerjaan, status_pernikahan, tanggal_bergabung, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE + ($12 || ' days')::interval, 'aktif')
       ON CONFLICT (nik) DO NOTHING`,
      [null, nama, nik, jk, tmpLahir, tglLahir, telp, email, alamat, kerja, statusNikah, String(offsetDays)]
    );
  }
  logger.info(`✅ ${list.length} jamaah diproses`);
};

const seedJadwal = async (adminId) => {
  logger.info('🕌 seeding jadwal sholat (hari ini)...');
  const items = [
    ['subuh', '04:35', 'Ustadz Ahmad Fauzi', null],
    ['dzuhur', '11:55', 'Ustadz Muhammad Ridwan', null],
    ['ashar', '15:15', 'Ustadz Abdul Rohman', null],
    ['maghrib', '17:55', 'Ustadz Ahmad Fauzi', null],
    ['isya', '19:05', 'Ustadz Muhammad Ridwan', null],
    ['jumat', '11:45', 'Ustadz Abdul Rohman', 'Ustadz Ahmad Fauzi'],
  ];
  for (const [sholat, waktu, imam, khotib] of items) {
    await query(
      `INSERT INTO jadwal_sholat (tanggal, sholat, waktu, kota, imam, khotib, keterangan, created_by)
       VALUES (CURRENT_DATE, $1, $2, 'Jakarta', $3, $4, NULL, $5)
       ON CONFLICT (tanggal, sholat, kota) DO NOTHING`,
      [sholat, waktu, imam, khotib, adminId]
    );
  }
  logger.info('✅ 6 jadwal sholat diproses');
};

const seedKegiatan = async () => {
  logger.info('📅 seeding kegiatan...');
  const now = new Date();
  const iso = (d) => new Date(d).toISOString();
  const day = 86400000;

  const list = [
    ['Kajian Rutin Tafsir Al-Qur\'an', 'Kajian mingguan tafsir surat Al-Baqarah bersama Ustadz Ahmad Fauzi.', 'ibadah', iso(now.getTime() + 2 * day), iso(now.getTime() + 2 * day + 5400000), 'Masjid Al-Mi\'raj', 'Ustadz Ahmad Fauzi', 'direncanakan'],
    ['Tahsin & Tahfidz Anak', 'Program pembinaan baca Al-Qur\'an untuk anak-anak usia 7-12 tahun setiap Sabtu pagi.', 'pendidikan', iso(now.getTime() + 4 * day), iso(now.getTime() + 4 * day + 7200000), 'Masjid Al-Mi\'raj', 'Nur Hidayah', 'direncanakan'],
    ['Bakti Sosial & Santunan Yatim', 'Pembagian sembako dan santunan untuk 50 keluarga yatim di sekitar masjid.', 'sosial', iso(now.getTime() + 7 * day), iso(now.getTime() + 7 * day + 14400000), 'Halaman Masjid', 'Siti Aminah', 'direncanakan'],
    ['Pertemuan Remaja Masjid', 'Pertemuan bulanan remaja masjid: evaluasi & program kerja.', 'pemuda', iso(now.getTime() - 3 * day), iso(now.getTime() - 3 * day + 7200000), 'Rangka Masjid', 'Yusuf Maulana', 'selesai'],
    ['Pengajian Muslimat', 'Pengajian rutin muslimat setiap Kamis pagi.', 'perempuan', iso(now.getTime() + 1 * day), null, 'Rangka Masjid', 'Zakiyah Astuti', 'direncanakan'],
  ];

  for (const [judul, deskripsi, kategori, mulai, selesai, lokasi, pic, status] of list) {
    await query(
      `INSERT INTO kegiatan (judul, deskripsi, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, gambar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8)
       ON CONFLICT DO NOTHING`,
      [judul, deskripsi, kategori, mulai, selesai, lokasi, pic, status]
    );
  }
  logger.info(`✅ ${list.length} kegiatan diproses`);
};

const seedKeuangan = async (adminId) => {
  logger.info('💰 seeding keuangan...');
  const d = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const list = [
    ['masuk', 'kas bulanan', 1500000, -60, 'Kas bulanan pengurus', 'tunai'],
    ['masuk', 'donasi', 750000, -60, 'Donasi dari jamaah', 'transfer'],
    ['keluar', 'utilitas', 450000, -60, 'Tagihan listrik & air', 'transfer'],
    ['keluar', 'pemeliharaan', 300000, -60, 'Service AC ruang utama', 'tunai'],
    ['masuk', 'kas bulanan', 1500000, -30, 'Kas bulanan pengurus', 'tunai'],
    ['masuk', 'donasi', 1200000, -30, 'Donasi pembangunan', 'transfer'],
    ['keluar', 'utilitas', 520000, -30, 'Tagihan listrik & air', 'transfer'],
    ['keluar', 'kegiatan', 800000, -30, 'Biaya bakti sosial', 'tunai'],
    ['masuk', 'kas bulanan', 1500000, 0, 'Kas bulanan pengurus', 'tunai'],
    ['masuk', 'donasi', 900000, 0, 'Donasi Jumat berkah', 'tunai'],
    ['keluar', 'utilitas', 480000, 0, 'Tagihan listrik & air', 'transfer'],
    ['keluar', 'perlengkapan', 250000, 0, 'Sajadah baru & perlengkapan', 'tunai'],
  ];
  for (const [jenis, kategori, jumlah, offset, ket, metode] of list) {
    await query(
      `INSERT INTO keuangan (jenis, kategori, jumlah, tanggal, keterangan, metode, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [jenis, kategori, jumlah, d(offset), ket, metode, adminId]
    );
  }
  logger.info(`✅ ${list.length} transaksi diproses`);
};

const seedDonasi = async (adminId) => {
  logger.info('🤲 seeding donasi...');
  const d = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const list = [
    ['Ahmad Fauzi', '3175010101900001', 500000, -30, 'transfer', 'Pembangunan masjid'],
    ['Siti Aminah', '3175030303920003', 300000, -30, 'tunai', 'Santunan yatim'],
    ['Abdul Rohman', '3175040404780004', 750000, 0, 'transfer', 'Operasional masjid'],
  ];

  for (const [nama, nik, jumlah, offset, metode, tujuan] of list) {
    const { rows } = await query('SELECT id FROM jamaah WHERE nik = $1', [nik]);
    const jamaahId = rows[0]?.id || null;

    // transaksi keuangan terkait
    const trx = await query(
      `INSERT INTO keuangan (jenis, kategori, jumlah, tanggal, keterangan, metode, created_by)
       VALUES ('masuk', 'donasi', $1, $2, $3, $4, $5) RETURNING id`,
      [jumlah, d(offset), `Donasi ${nama}${tujuan ? ` - ${tujuan}` : ''}`, metode, adminId]
    );

    await query(
      `INSERT INTO donasi (nama_donatur, jamaah_id, jumlah, tanggal, metode, tujuan, transaksi_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [nama, jamaahId, jumlah, d(offset), metode, tujuan, trx.rows[0].id, adminId]
    );
  }
  logger.info(`✅ ${list.length} donasi diproses`);
};

const seedInventaris = async () => {
  logger.info('📦 seeding inventaris...');
  const d = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const list = [
    ['Sajadah Premium', 'INV-SJD-001', 'Perlengkapan Ibadah', 120, 'lembar', 'baik', -180, 25000000, 22000000, 'Ruang Utama', 'Donasi jamaah'],
    ['Al-Qur\'an Mushaf', 'INV-QRN-001', 'Perlengkapan Ibadah', 200, 'eksemplar', 'baik', -365, 3000000, 2500000, 'Rak Al-Qur\'an', 'Kas masjid'],
    ['Speaker Aktif', 'INV-SPK-001', 'Elektronik', 4, 'unit', 'baik', -365, 8000000, 6500000, 'Mimbar & Ruang', 'Kas masjid'],
    ['AC Split 2 PK', 'INV-AC-001', 'Elektronik', 6, 'unit', 'rusak_ringan', -1095, 30000000, 12000000, 'Ruang Utama', 'Donasi jamaah'],
    ['Karpet Masjid', 'INV-KRP-001', 'Perlengkapan Ibadah', 20, 'lembar', 'baik', -730, 15000000, 10000000, 'Ruang Utama', 'Kas masjid'],
    ['Kursi Lipit', 'INV-KRS-001', 'Furniture', 100, 'buah', 'baik', -730, 5000000, 4000000, 'Rangka', 'Kas masjid'],
    ['Proyektor', 'INV-PRJ-001', 'Elektronik', 2, 'unit', 'baik', -365, 12000000, 9000000, 'Ruang Kajian', 'Donasi jamaah'],
    ['Tempat Wudhu Stainless', 'INV-WDH-001', 'Sarana Umum', 12, 'unit', 'rusak_berat', -1825, 18000000, 3000000, 'Area Wudhu', 'Kas masjid'],
  ];
  for (const [nama, kode, kategori, jumlah, satuan, kondisi, offset, harga, nilai, lokasi, sumber] of list) {
    await query(
      `INSERT INTO inventaris (nama, kode, kategori, jumlah, satuan, kondisi, tanggal_beli, harga_beli, estimasi_nilai, lokasi, sumber_dana)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (kode) DO NOTHING`,
      [nama, kode, kategori, jumlah, satuan, kondisi, d(offset), harga, nilai, lokasi, sumber]
    );
  }
  logger.info(`✅ ${list.length} inventaris diproses`);
};

const seedPengumuman = async () => {
  logger.info('📢 seeding pengumuman...');
  const d = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const list = [
    ['Jadwal Sholat & Kajian Ramadhan', 'Mulai besok jadwal sholat tarawih pukul 19.30 WIB setelah isya. Mari kita niatkan puasa dan perbanyak ibadah di bulan suci.', 'ibadah', 'tinggi', 0, 30],
    ['Undangan Bakti Sosial', 'Mengundang seluruh jamaah untuk berpartisipasi dalam bakti sosial & santunan yatim pekan depan. Konfirmasi ke pengurus.', 'sosial', 'sedang', 0, 7],
    ['Perbaikan Area Wudhu', 'Area wudhu akan direnovasi selama 3 hari. Mohon gunakan area wudhu sementara di samping masjid.', 'umum', 'sedang', 0, 3],
    ['Pengingat Kas Bulanan', 'Pengingat pembayaran kas bulanan pengurus dapat diserahkan kepada bendahara setiap jadwal pertemuan.', 'keuangan', 'rendah', -10, null],
  ];
  for (const [judul, isi, kategori, prioritas, mulaiOffset, selesaiOffset] of list) {
    await query(
      `INSERT INTO pengumuman (judul, isi, kategori, prioritas, tanggal_mulai, tanggal_selesai, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'aktif')`,
      [judul, isi, kategori, prioritas, d(mulaiOffset), selesaiOffset === null ? null : d(selesaiOffset)]
    );
  }
  logger.info(`✅ ${list.length} pengumuman diproses`);
};

const main = async () => {
  try {
    logger.info('🌱 Memulai seeding database Masjid Al-Mi\'raj...');

    const users = await seedUsers();
    users.forEach((u) => logger.info(`   - ${u.email} (${u.role}) [${u.status}]`));

    const admin = users.find((u) => u.role === 'admin');
    const adminId = admin?.id || null;

    await seedJamaah(adminId);
    await seedJadwal(adminId);
    await seedKegiatan();
    await seedKeuangan(adminId);
    await seedDonasi(adminId);
    await seedInventaris();
    await seedPengumuman();

    logger.info('');
    logger.info('🎉 Seeding selesai!');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('  AKUN DEFAULT (GANTI PASSWORD SEGERA SETELAH LOGIN!)');
    logger.info('  Email    : admin@masjidalmiraj.sch.id');
    logger.info('  Password : admin12345');
    logger.info('  Email    : pengurus@masjidalmiraj.sch.id');
    logger.info('  Password : pengurus12345');
    logger.info('  Email    : jamaah@masjidalmiraj.sch.id');
    logger.info('  Password : jamaah12345');
    logger.info('═══════════════════════════════════════════════════════════');
  } catch (err) {
    logger.error('❌ Seeding gagal:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

main();
