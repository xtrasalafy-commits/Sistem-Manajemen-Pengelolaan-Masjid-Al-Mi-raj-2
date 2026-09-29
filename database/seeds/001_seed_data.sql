-- ============================================================================
-- SEED DATA - Sistem Manajemen Masjid Al-Mi'raj
-- ============================================================================
-- PRASYARAT:
--   1. Migration 001_init.sql sudah dijalankan
--   2. Minimal satu user admin sudah ada (jalankan: npm --prefix backend run db:seed)
--
-- Catatan: seeder utama (JS) akan membuat user + seluruh data contoh ini
-- secara otomatis dengan password yang di-hash bcrypt. File SQL ini
-- disediakan sebagai alternatif bila Anda ingin seeding manual dari
-- Neon SQL Editor.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- JAMAAH
-- ----------------------------------------------------------------------------
INSERT INTO jamaah (nama, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, telepon, email, alamat, pekerjaan, status_pernikahan, tanggal_bergabung, status)
VALUES
  ('Ahmad Fauzi',          '3175010101900001', 'laki-laki', 'Jakarta', '1990-01-01', '081234567801', 'ahmad.fauzi@example.com', 'Jl. Kebon Jeruk No. 1, Jakarta Barat', 'Pengusaha',  'menikah',      CURRENT_DATE - INTERVAL '2 years', 'aktif'),
  ('Muhammad Ridwan',      '3175010202850002', 'laki-laki', 'Bandung', '1985-02-02', '081234567802', 'm.ridwan@example.com',     'Jl. Mangga Dua No. 5, Jakarta Pusat',  'Guru',      'menikah',      CURRENT_DATE - INTERVAL '18 months', 'aktif'),
  ('Siti Aminah',          '3175030303920003', 'perempuan', 'Bogor',   '1992-03-03', '081234567803', 'siti.aminah@example.com',  'Jl. Melati No. 12, Jakarta Selatan',   'Ibu Rumah Tangga','menikah', CURRENT_DATE - INTERVAL '1 year',  'aktif'),
  ('Abdul Rohman',         '3175040404780004', 'laki-laki', 'Surabaya','1978-04-04', '081234567804', 'a.rohman@example.com',     'Jl. Kenanga No. 8, Jakarta Timur',     'PNS',       'menikah',      CURRENT_DATE - INTERVAL '3 years', 'aktif'),
  ('Nur Hidayah',          '3175050505950005', 'perempuan', 'Depok',   '1995-05-05', '081234567805', 'nur.hidayah@example.com',  'Jl. Anggrek No. 3, Depok',             'Mahasiswa', 'belum_menikah',CURRENT_DATE - INTERVAL '6 months', 'aktif'),
  ('Hendra Gunawan',       '3175060606880006', 'laki-laki', 'Medan',   '1988-06-06', '081234567806', 'hendra.g@example.com',     'Jl. Flamboyan No. 22, Jakarta Barat',  'Karyawan',  'menikah',      CURRENT_DATE - INTERVAL '10 months','nonaktif'),
  ('Zakiyah Astuti',       '3175070707910007', 'perempuan', 'Solo',    '1991-07-07', '081234567807', 'zakiyah.a@example.com',    'Jl. Dahlia No. 9, Tangerang',          'Apoteker',  'menikah',      CURRENT_DATE - INTERVAL '1 year',  'aktif'),
  ('Yusuf Maulana',        '3175080808830008', 'laki-laki', 'Yogyakarta','1983-08-08','081234567808','yusuf.m@example.com',      'Jl. Cempaka No. 14, Bekasi',           'Arsitek',   'menikah',      CURRENT_DATE - INTERVAL '2 years', 'aktif')
ON CONFLICT (nik) DO NOTHING;

-- ----------------------------------------------------------------------------
-- JADWAL SHOLAT (hari ini)
-- ----------------------------------------------------------------------------
INSERT INTO jadwal_sholat (tanggal, sholat, waktu, kota, imam, khotib, keterangan)
VALUES
  (CURRENT_DATE, 'subuh',   '04:35', 'Jakarta', 'Ustadz Ahmad Fauzi', NULL, 'Imam tetap'),
  (CURRENT_DATE, 'dzuhur',  '11:55', 'Jakarta', 'Ustadz Muhammad Ridwan', NULL, NULL),
  (CURRENT_DATE, 'ashar',   '15:15', 'Jakarta', 'Ustadz Abdul Rohman', NULL, NULL),
  (CURRENT_DATE, 'maghrib', '17:55', 'Jakarta', 'Ustadz Ahmad Fauzi', NULL, NULL),
  (CURRENT_DATE, 'isya',    '19:05', 'Jakarta', 'Ustadz Muhammad Ridwan', NULL, NULL),
  (CURRENT_DATE, 'jumat',   '11:45', 'Jakarta', 'Ustadz Abdul Rohman', 'Ustadz Ahmad Fauzi', 'Khutbah bahasa Indonesia')
ON CONFLICT (tanggal, sholat, kota) DO NOTHING;

-- ----------------------------------------------------------------------------
-- KEGIATAN
-- ----------------------------------------------------------------------------
INSERT INTO kegiatan (judul, deskripsi, kategori, tanggal_mulai, tanggal_selesai, lokasi, pic, status)
VALUES
  ('Kajian Rutin Tafsir Al-Qur''an', 'Kajian mingguan tafsir surat Al-Baqarah bersama Ustadz Ahmad Fauzi.', 'ibadah',
    CURRENT_DATE + INTERVAL '2 days' || ' 19:30:00', CURRENT_DATE + INTERVAL '2 days' || ' 21:00:00', 'Masjid Al-Mi''raj', 'Ustadz Ahmad Fauzi', 'direncanakan'),
  ('Tahsin & Tahfidz Anak', 'Program pembinaan baca Al-Qur''an untuk anak-anak usia 7-12 tahun setiap Sabtu pagi.', 'pendidikan',
    CURRENT_DATE + INTERVAL '4 days' || ' 08:00:00', CURRENT_DATE + INTERVAL '4 days' || ' 10:00:00', 'Masjid Al-Mi''raj', 'Nur Hidayah', 'direncanakan'),
  ('Bakti Sosial & Santunan Yatim', 'Pembagian sembako dan santunan untuk 50 keluarga yatim di sekitar masjid.', 'sosial',
    CURRENT_DATE + INTERVAL '7 days' || ' 09:00:00', CURRENT_DATE + INTERVAL '7 days' || ' 13:00:00', 'Halaman Masjid', 'Siti Aminah', 'direncanakan'),
  ('Kembar Maju Remaja Masjid', 'Pertemuan bulanan remaja masjid: evaluasi & program kerja.', 'pemuda',
    CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days' || ' 20:00:00', 'Rangka Masjid', 'Yusuf Maulana', 'selesai'),
  ('Pengajian Muslimat', 'Pengajian rutin muslimat setiap Kamis pagi.', 'perempuan',
    CURRENT_DATE + INTERVAL '1 day', NULL, 'Rangka Masjid', 'Zakiyah Astuti', 'direncanakan');

-- ----------------------------------------------------------------------------
-- KEUANGAN (3 bulan terakhir)
-- ----------------------------------------------------------------------------
INSERT INTO keuangan (jenis, kategori, jumlah, tanggal, keterangan, metode, created_by)
VALUES
  ('masuk',  'kas bulanan',    1500000, CURRENT_DATE - INTERVAL '2 months', 'Kas bulanan pengurus', 'tunai',  (SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('masuk',  'donasi',          750000, CURRENT_DATE - INTERVAL '2 months', 'Donasi dari jamaah',    'transfer',(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('keluar', 'utilitas',        450000, CURRENT_DATE - INTERVAL '2 months', 'Tagihan listrik & air', 'transfer',(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('keluar', 'pemeliharaan',    300000, CURRENT_DATE - INTERVAL '2 months', 'Service AC ruang utama','tunai',  (SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('masuk',  'kas bulanan',    1500000, CURRENT_DATE - INTERVAL '1 month', 'Kas bulanan pengurus', 'tunai',  (SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('masuk',  'donasi',         1200000, CURRENT_DATE - INTERVAL '1 month', 'Donasi pembangunan',    'transfer',(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('keluar', 'utilitas',        520000, CURRENT_DATE - INTERVAL '1 month', 'Tagihan listrik & air', 'transfer',(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('keluar', 'kegiatan',        800000, CURRENT_DATE - INTERVAL '1 month', 'Biaya bakti sosial',    'tunai',  (SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('masuk',  'kas bulanan',    1500000, CURRENT_DATE,                      'Kas bulanan pengurus', 'tunai',  (SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('masuk',  'donasi',          900000, CURRENT_DATE,                      'Donasi Jumat berkah',  'tunai',  (SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('keluar', 'utilitas',        480000, CURRENT_DATE,                      'Tagihan listrik & air', 'transfer',(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1)),
  ('keluar', 'perlengkapan',    250000, CURRENT_DATE,                      'Belas kas & perlengkapan sajadah baru','tunai',(SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1));

-- ----------------------------------------------------------------------------
-- DONASI
-- ----------------------------------------------------------------------------
INSERT INTO donasi (nama_donatur, jamaah_id, jumlah, tanggal, metode, tujuan, transaksi_id)
SELECT 'Ahmad Fauzi', j.id, 500000, CURRENT_DATE - INTERVAL '1 month', 'transfer', 'Pembangunan masjid', NULL
FROM jamaah j WHERE j.nik='3175010101900001'
UNION ALL
SELECT 'Siti Aminah', j.id, 300000, CURRENT_DATE - INTERVAL '1 month', 'tunai', 'Santunan yatim', NULL
FROM jamaah j WHERE j.nik='3175030303920003'
UNION ALL
SELECT 'Abdul Rohman', j.id, 750000, CURRENT_DATE, 'transfer', 'Operasional masjid', NULL
FROM jamaah j WHERE j.nik='3175040404780004';

-- ----------------------------------------------------------------------------
-- INVENTARIS
-- ----------------------------------------------------------------------------
INSERT INTO inventaris (nama, kode, kategori, jumlah, satuan, kondisi, tanggal_beli, harga_beli, estimasi_nilai, lokasi, sumber_dana, keterangan)
VALUES
  ('Sajadah Premium',       'INV-SJD-001', 'Perlengkapan Ibadah', 120, 'lembar', 'baik',         CURRENT_DATE - INTERVAL '6 months',  25000000, 22000000, 'Ruang Utama',    'Donasi jamaah', 'Sajadah utama ukuran 60x110'),
  ('Al-Qur''an Mushaf',     'INV-QRN-001', 'Perlengkapan Ibadah', 200, 'eksemplar','baik',      CURRENT_DATE - INTERVAL '1 year',   3000000,  2500000,  'Rak Al-Qur''an','Kas masjid',   NULL),
  ('Speaker Aktif',         'INV-SPK-001', 'Elektronik',           4, 'unit',    'baik',         CURRENT_DATE - INTERVAL '1 year',   8000000,  6500000,  'Mimbar & Ruang','Kas masjid',   ' merek XYZ 500W'),
  ('AC Split 2 PK',         'INV-AC-001',  'Elektronik',           6, 'unit',    'rusak_ringan', CURRENT_DATE - INTERVAL '3 years',  30000000, 12000000, 'Ruang Utama',   'Donasi jamaah','1 unit perlu service'),
  ('Karpet Masjid',         'INV-KRP-001', 'Perlengkapan Ibadah',  20, 'lembar', 'baik',         CURRENT_DATE - INTERVAL '2 years',  15000000, 10000000, 'Ruang Utama',   'Kas masjid',   NULL),
  ('Kursi Lipit',           'INV-KRS-001', 'Furniture',           100, 'buah',   'baik',         CURRENT_DATE - INTERVAL '2 years',  5000000,  4000000,  'Rangka',        'Kas masjid',   NULL),
  ('Proyektor',             'INV-PRJ-001', 'Elektronik',           2, 'unit',    'baik',         CURRENT_DATE - INTERVAL '1 year',   12000000, 9000000,  'Ruang Kajian',  'Donasi jamaah',NULL),
  ('Tempat Wudhu Stainless','INV-WDH-001', 'Sarana Umum',         12, 'unit',    'rusak_berat', CURRENT_DATE - INTERVAL '5 years',  18000000, 3000000,  'Area Wudhu',   'Kas masjid',   'Perlu penggantian');

-- ----------------------------------------------------------------------------
-- PENGUMUMAN
-- ----------------------------------------------------------------------------
INSERT INTO pengumuman (judul, isi, kategori, prioritas, tanggal_mulai, tanggal_selesai, status)
VALUES
  ('Jadwal Sholat & Kajian Ramadhan', 'Mulai besok jadwal sholat tarawih pukul 19.30 WIB setelah isya. Mari kita niatkan puasa dan perbanyak ibadah di bulan suci.', 'ibadah', 'tinggi', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'aktif'),
  ('Undangan Bakti Sosial',           'Mengundang seluruh jamaah untuk berpartisipasi dalam bakti sosial & santunan yatim pekan depan. Konfirmasi ke pengurus.',       'sosial', 'sedang', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days',  'aktif'),
  ('Perbaikan Area Wudhu',             'Area wudhu akan direnovasi selama 3 hari. Mohon gunakan area wudhu sementara di samping masjid.',                              'umum',   'sedang', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days',  'aktif'),
  ('Kas Bulanan',                      'Pengingat pembayaran kas bulanan pengurus dapat diserahkan kepada bendahara setiap jadwal pertemuan.',                          'keuangan','rendah', CURRENT_DATE - INTERVAL '10 days', NULL, 'aktif');

-- ----------------------------------------------------------------------------
-- NOTIFIKASI (broadcast)
-- ----------------------------------------------------------------------------
INSERT INTO notifikasi (user_id, judul, pesan, tipe)
VALUES
  (NULL, 'Selamat Datang!', 'Selamat datang di Sistem Manajemen Masjid Al-Mi''raj. Semoga bermanfaat.', 'info'),
  (NULL, 'Pengumuman Baru', 'Ada pengumuman baru: Jadwal Sholat & Kajian Ramadhan.', 'pengumuman');

COMMIT;
