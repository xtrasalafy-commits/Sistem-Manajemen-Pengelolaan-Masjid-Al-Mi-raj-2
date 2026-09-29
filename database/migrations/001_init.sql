-- ============================================================================
-- SISTEM MANAJEMEN PENGELOLAAN MASJID AL-MI'RAJ
-- Migration 001 - Initial Schema (Neon / PostgreSQL 15+)
-- ============================================================================
-- Jalankan di Neon SQL Editor, atau via: npm --prefix backend run db:migrate
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), crypt()

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role        AS ENUM ('admin', 'pengurus', 'jamaah');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_aktif     AS ENUM ('aktif', 'nonaktif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE jenis_kelamin    AS ENUM ('laki-laki', 'perempuan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sholat_nama      AS ENUM ('subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaksi_jenis  AS ENUM ('masuk', 'keluar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kegiatan_status  AS ENUM ('direncanakan', 'berlangsung', 'selesai', 'dibatalkan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventaris_kondisi AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'hilang');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prioritas_level  AS ENUM ('tinggi', 'sedang', 'rendah');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE laporan_jenis    AS ENUM ('keuangan', 'jamaah', 'kegiatan', 'inventaris', 'umum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION (dipakai semua tabel)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USERS  (autentikasi & manajemen akun)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,          -- bcrypt hash
  role          user_role     NOT NULL DEFAULT 'jamaah',
  telepon       VARCHAR(20),
  alamat        TEXT,
  foto_url      VARCHAR(500),
  status        status_aktif  NOT NULL DEFAULT 'aktif',
  last_login    TIMESTAMPTZ,
  refresh_token VARCHAR(500),                   -- refresh token (rotasi)
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_nama   ON users USING gin (nama gin_trgm_ops);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 2. JAMAAH / ANGGOTA
-- ============================================================================
CREATE TABLE IF NOT EXISTS jamaah (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  nama             VARCHAR(255) NOT NULL,
  nik              VARCHAR(16) UNIQUE,
  jenis_kelamin    jenis_kelamin,
  tempat_lahir     VARCHAR(100),
  tanggal_lahir    DATE,
  telepon          VARCHAR(20),
  email            VARCHAR(255),
  alamat           TEXT,
  pekerjaan        VARCHAR(100),
  status_pernikahan VARCHAR(20) DEFAULT 'menikah'
                   CHECK (status_pernikahan IN ('belum_menikah','menikah','janda','duda')),
  tanggal_bergabung DATE NOT NULL DEFAULT CURRENT_DATE,
  status           status_aktif NOT NULL DEFAULT 'aktif',
  keterangan       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jamaah_user_id      ON jamaah(user_id);
CREATE INDEX IF NOT EXISTS idx_jamaah_nama         ON jamaah USING gin (nama gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jamaah_status       ON jamaah(status);
CREATE INDEX IF NOT EXISTS idx_jamaah_tgl_bergabung ON jamaah(tanggal_bergabung);
CREATE TRIGGER trg_jamaah_updated_at BEFORE UPDATE ON jamaah
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 3. JADWAL SHOLAT
-- ============================================================================
CREATE TABLE IF NOT EXISTS jadwal_sholat (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal     DATE NOT NULL,
  sholat      sholat_nama NOT NULL,
  waktu       TIME NOT NULL,
  kota        VARCHAR(100) NOT NULL DEFAULT 'Jakarta',
  imam        VARCHAR(255),
  khotib      VARCHAR(255),
  keterangan  TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tanggal, sholat, kota)
);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_sholat(tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_sholat  ON jadwal_sholat(sholat);
CREATE INDEX IF NOT EXISTS idx_jadwal_kota    ON jadwal_sholat(kota);
CREATE TRIGGER trg_jadwal_updated_at BEFORE UPDATE ON jadwal_sholat
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 4. KEGIATAN / EVENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS kegiatan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul         VARCHAR(255) NOT NULL,
  deskripsi     TEXT,
  kategori      VARCHAR(50) NOT NULL DEFAULT 'lainnya'
                CHECK (kategori IN ('ibadah','pendidikan','sosial','pemuda','perempuan','lainnya')),
  tanggal_mulai TIMESTAMPTZ NOT NULL,
  tanggal_selesai TIMESTAMPTZ,
  lokasi        VARCHAR(255) NOT NULL DEFAULT 'Masjid Al-Mi''raj',
  pic           VARCHAR(255),
  gambar_url    VARCHAR(500),
  status        kegiatan_status NOT NULL DEFAULT 'direncanakan',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kegiatan_tanggal_mulai ON kegiatan(tanggal_mulai);
CREATE INDEX IF NOT EXISTS idx_kegiatan_status        ON kegiatan(status);
CREATE INDEX IF NOT EXISTS idx_kegiatan_kategori      ON kegiatan(kategori);
CREATE INDEX IF NOT EXISTS idx_kegiatan_judul         ON kegiatan USING gin (judul gin_trgm_ops);
CREATE TRIGGER trg_kegiatan_updated_at BEFORE UPDATE ON kegiatan
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 5. KEUANGAN (Kas & Transaksi)  +  5b. DONASI
-- ============================================================================
CREATE TABLE IF NOT EXISTS keuangan (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis          transaksi_jenis NOT NULL,
  kategori       VARCHAR(100) NOT NULL,
  jumlah         DECIMAL(15,2) NOT NULL CHECK (jumlah > 0),
  tanggal        DATE NOT NULL,
  keterangan     TEXT,
  bukti_file_url VARCHAR(500),
  metode         VARCHAR(50) NOT NULL DEFAULT 'tunai',
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_keuangan_tanggal  ON keuangan(tanggal);
CREATE INDEX IF NOT EXISTS idx_keuangan_jenis    ON keuangan(jenis);
CREATE INDEX IF NOT EXISTS idx_keuangan_kategori ON keuangan(kategori);
CREATE INDEX IF NOT EXISTS idx_keuangan_tanggal_jenis ON keuangan(tanggal, jenis);
CREATE TRIGGER trg_keuangan_updated_at BEFORE UPDATE ON keuangan
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS donasi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_donatur VARCHAR(255) NOT NULL,
  jamaah_id    UUID REFERENCES jamaah(id) ON DELETE SET NULL,
  jumlah       DECIMAL(15,2) NOT NULL CHECK (jumlah > 0),
  tanggal      DATE NOT NULL,
  metode       VARCHAR(50) NOT NULL DEFAULT 'tunai',
  tujuan       VARCHAR(255),
  keterangan   TEXT,
  transaksi_id UUID REFERENCES keuangan(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_donasi_jamaah_id ON donasi(jamaah_id);
CREATE INDEX IF NOT EXISTS idx_donasi_tanggal   ON donasi(tanggal);
CREATE INDEX IF NOT EXISTS idx_donasi_nama       ON donasi USING gin (nama_donatur gin_trgm_ops);

-- ============================================================================
-- 6. INVENTARIS / ASET
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventaris (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama           VARCHAR(255) NOT NULL,
  kode           VARCHAR(50) UNIQUE,
  kategori       VARCHAR(100),
  jumlah         INTEGER NOT NULL DEFAULT 1 CHECK (jumlah >= 0),
  satuan         VARCHAR(20) NOT NULL DEFAULT 'unit',
  kondisi        inventaris_kondisi NOT NULL DEFAULT 'baik',
  tanggal_beli   DATE,
  harga_beli     DECIMAL(15,2) CHECK (harga_beli >= 0),
  estimasi_nilai DECIMAL(15,2) CHECK (estimasi_nilai >= 0),
  lokasi         VARCHAR(255),
  sumber_dana    VARCHAR(255),
  keterangan     TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventaris_nama     ON inventaris USING gin (nama gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventaris_kategori ON inventaris(kategori);
CREATE INDEX IF NOT EXISTS idx_inventaris_kondisi  ON inventaris(kondisi);
CREATE TRIGGER trg_inventaris_updated_at BEFORE UPDATE ON inventaris
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 7. PENGUMUMAN
-- ============================================================================
CREATE TABLE IF NOT EXISTS pengumuman (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul         VARCHAR(255) NOT NULL,
  isi           TEXT NOT NULL,
  kategori      VARCHAR(100) NOT NULL DEFAULT 'umum',
  prioritas     prioritas_level NOT NULL DEFAULT 'sedang',
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  attachment_url VARCHAR(500),
  status        status_aktif NOT NULL DEFAULT 'aktif',
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pengumuman_tanggal ON pengumuman(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_pengumuman_status  ON pengumuman(status);
CREATE INDEX IF NOT EXISTS idx_pengumuman_judul   ON pengumuman USING gin (judul gin_trgm_ops);
CREATE TRIGGER trg_pengumuman_updated_at BEFORE UPDATE ON pengumuman
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 8. LAPORAN
-- ============================================================================
CREATE TABLE IF NOT EXISTS laporan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul         VARCHAR(255) NOT NULL,
  jenis         laporan_jenis NOT NULL,
  periode_mulai DATE NOT NULL,
  periode_selesai DATE NOT NULL,
  ringkasan     TEXT,
  file_url      VARCHAR(500),
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT laporan_periode_valid CHECK (periode_selesai >= periode_mulai)
);
CREATE INDEX IF NOT EXISTS idx_laporan_jenis   ON laporan(jenis);
CREATE INDEX IF NOT EXISTS idx_laporan_periode ON laporan(periode_mulai, periode_selesai);
CREATE TRIGGER trg_laporan_updated_at BEFORE UPDATE ON laporan
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 9. AUDIT LOG  (audit trail transaksi & aksi kritis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  aksi       VARCHAR(50) NOT NULL,        -- CREATE, UPDATE, DELETE, EXPORT, LOGIN, LOGOUT
  modul      VARCHAR(50) NOT NULL,        -- keuangan, jamaah, inventaris, ...
  record_id  UUID,
  detail     JSONB,                       -- { before: ..., after: ... }
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_id   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_modul     ON audit_logs(modul);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs(created_at);

-- ============================================================================
-- 10. NOTIFIKASI
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifikasi (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL = broadcast
  judul      VARCHAR(255) NOT NULL,
  pesan      TEXT NOT NULL,
  tipe       VARCHAR(50) NOT NULL DEFAULT 'info',
  data       JSONB,
  dibaca     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifikasi(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_dibaca  ON notifikasi(user_id, dibaca);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifikasi(created_at);

-- ============================================================================
-- 11. FILES / DOKUMENTASI  (registry file upload)
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_file    VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  path         VARCHAR(500) NOT NULL,
  url          VARCHAR(500),
  mime_type    VARCHAR(100),
  size         BIGINT,
  kategori     VARCHAR(50) NOT NULL DEFAULT 'dokumen',
  reference_id UUID,
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_files_kategori    ON files(kategori);
CREATE INDEX IF NOT EXISTS idx_files_reference   ON files(reference_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- ============================================================================
-- VIEW: ringkasan kas (helper untuk laporan)
-- ============================================================================
CREATE OR REPLACE VIEW v_keuangan_ringkas AS
SELECT
  DATE_TRUNC('month', tanggal) AS bulan,
  COALESCE(SUM(CASE WHEN jenis = 'masuk'  THEN jumlah ELSE 0 END), 0) AS total_masuk,
  COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0) AS total_keluar,
  COALESCE(SUM(CASE WHEN jenis = 'masuk'  THEN jumlah ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0) AS saldo
FROM keuangan
GROUP BY 1;
