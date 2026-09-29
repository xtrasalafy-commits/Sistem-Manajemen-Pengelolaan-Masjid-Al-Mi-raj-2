# 📖 Dokumentasi API — Masjid Al-Mi'raj

Base URL: `http://localhost:5000/api`

## Konvensi

### Format Response

**Sukses:**
```json
{
  "status": "success",
  "message": "Pesan info (opsional)",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "fail | error",
  "message": "Deskripsi error",
  "errors": [ { "field": "nama", "message": "..." } ]  // hanya untuk validation error
}
```

### Status Code

| Code | Keterangan |
|------|------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (token salah/kadaluarsa) |
| 403 | Forbidden (role tidak cukup) |
| 404 | Not Found |
| 409 | Conflict (duplikat data) |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |

### Autentikasi

Semua endpoint bertanda 🔒 memerlukan header:

```
Authorization: Bearer <access_token>
```

Access token didapat dari `POST /auth/login` / `POST /auth/register` (field `accessToken`).
Refresh token otomatis tersimpan di **httpOnly cookie**; saat access token kadaluarsa,
interceptor frontend akan memanggil `POST /auth/refresh` secara otomatis.

### Pagination

Parameter query standar:
| Param | Default | Keterangan |
|-------|---------|------------|
| `page` | 1 | Halaman |
| `limit` | 10 | Item per halaman (maks 100) |
| `search` | - | Kata kunci pencarian |
| `sortBy` | per modul | Kolom sort (whitelist) |
| `sortOrder` | asc | `asc` / `desc` |

Response pagination:
```json
"pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
```

---

## 🔐 Auth

### POST /auth/register
Register user baru (default role `jamaah`). Admin yang login dapat menentukan role lain.

```jsonc
// Request body
{
  "nama": "Ahmad Fauzi",
  "email": "ahmad@email.com",
  "password": "Password123",   // min 8, ada huruf besar, kecil & angka
  "telepon": "08123456789",    // opsional
  "alamat": "Jl. Damai No. 1"  // opsional
}
```
```jsonc
// Response 201
{
  "status": "success",
  "message": "Registrasi berhasil",
  "data": { "user": { "id", "nama", "email", "role", ... }, "accessToken": "...", "refreshToken": "..." }
}
```

### POST /auth/login
```jsonc
// Request
{ "email": "admin@masjidalmiraj.sch.id", "password": "admin12345" }
// Response 200
{ "status": "success", "message": "Login berhasil", "data": { "user": {...}, "accessToken": "..." } }
```

### POST /auth/logout
Menghapus refresh token. Response 200.

### POST /auth/refresh
Body boleh kosong (refresh token dibaca dari cookie). Response:
```json
{ "status": "success", "data": { "accessToken": "...", "refreshToken": "...", "user": {...} } }
```

### GET /auth/me 🔒
Profil user yang login.

### PUT /auth/me 🔒
```json
{ "nama": "Nama Baru", "telepon": "0812xxx", "alamat": "Alamat baru", "fotoUrl": "..." }
```

### PUT /auth/change-password 🔒
```json
{ "passwordLama": "...", "passwordBaru": "NewPassword123" }
```

---

## 📊 Dashboard

### GET /dashboard 🔒
Statistik agregat untuk dashboard.

```jsonc
{
  "status": "success",
  "data": {
    "jamaah": { "total": 8, "aktif": 7 },
    "users": { "total": 3, "admin": 1, "pengurus": 1 },
    "kegiatan": { "total": 5, "upcoming": 4 },
    "keuangan": {
      "tahun": { "masuk": 12000000, "keluar": 6500000, "saldo": 5500000 },
      "bulanIni": { "masuk": 2400000, "keluar": 730000, "saldo": 1670000 }
    },
    "donasiBulanIni": 900000,
    "pengumumanAktif": 4,
    "inventaris": { "total": 8, "nilai": 64000000 },
    "chartBulanan": [{ "bulan": "2026-01", "masuk": 1500000, "keluar": 750000 }],
    "chartDonasi": [{ "tujuan": "Pembangunan masjid", "total": 500000 }]
  }
}
```

---

## 👥 Jamaah

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/jamaah` | Private |
| GET | `/jamaah/statistik` | Private |
| GET | `/jamaah/:id` | Private |
| POST | `/jamaah` | Admin, Pengurus |
| PUT | `/jamaah/:id` | Admin, Pengurus |
| DELETE | `/jamaah/:id` | Admin |

**GET /jamaah** — query: `page, limit, search, jenisKelamin, status, sortBy, sortOrder`

**POST /jamaah:**
```json
{
  "nama": "Ahmad Fauzi",              // wajib
  "nik": "3175010101900001",           // opsional, 16 digit
  "jenisKelamin": "laki-laki",         // opsional
  "tempatLahir": "Jakarta",
  "tanggalLahir": "1990-01-01",
  "telepon": "081234567801",
  "email": "ahmad@email.com",
  "alamat": "Jl. ...",
  "pekerjaan": "Pengusaha",
  "statusPernikahan": "menikah",
  "tanggalBergabung": "2024-01-01",
  "status": "aktif"
}
```

---

## 🕐 Jadwal Sholat

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/jadwal?tanggal=YYYY-MM-DD` atau `?bulan=YYYY-MM&kota=` | Private |
| GET | `/jadwal/today?kota=Jakarta` | Private |
| GET | `/jadwal/:id` | Private |
| POST | `/jadwal` | Admin, Pengurus |
| POST | `/jadwal/bulk` | Admin, Pengurus |
| PUT | `/jadwal/:id` | Admin, Pengurus |
| DELETE | `/jadwal/:id` | Admin |

**POST /jadwal:**
```json
{ "tanggal": "2026-01-15", "sholat": "subuh", "waktu": "04:35", "kota": "Jakarta", "imam": "Ustadz Ahmad", "khotib": null, "keterangan": null }
```
`sholat` ∈ `subuh | dzuhur | ashar | maghrib | isya | jumat`

**POST /jadwal/bulk:**
```json
{
  "kota": "Jakarta",
  "imam": "Ustadz Ahmad",
  "items": [
    { "tanggal": "2026-01-15", "sholat": "subuh", "waktu": "04:35" },
    { "tanggal": "2026-01-15", "sholat": "dzuhur", "waktu": "11:55" }
  ]
}
```

---

## 📅 Kegiatan

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/kegiatan?search=&kategori=&status=&bulan=YYYY-MM` | Private |
| GET | `/kegiatan/calendar?bulan=YYYY-MM` | Private |
| GET | `/kegiatan/berlangsung` | Private |
| GET | `/kegiatan/:id` | Private |
| POST | `/kegiatan` | Admin, Pengurus |
| PUT | `/kegiatan/:id` | Admin, Pengurus |
| DELETE | `/kegiatan/:id` | Admin |

**POST /kegiatan:**
```json
{
  "judul": "Kajian Rutin Tafsir",      // wajib
  "deskripsi": "Kajian mingguan...",
  "kategori": "ibadah",                 // ibadah|pendidikan|sosial|pemuda|perempuan|lainnya
  "tanggalMulai": "2026-01-15T19:30:00",
  "tanggalSelesai": "2026-01-15T21:00:00",
  "lokasi": "Masjid Al-Mi'raj",
  "pic": "Ustadz Ahmad",
  "gambarUrl": null,
  "status": "direncanakan"              // direncanakan|berlangsung|selesai|dibatalkan
}
```

---

## 💰 Keuangan

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/keuangan?jenis=&kategori=&tanggalMulai=&tanggalSelesai=&bulan=` | Private |
| GET | `/keuangan/statistik?tahun=2026` | Private |
| GET | `/keuangan/export?format=xlsx\|pdf` | Admin, Pengurus |
| POST | `/keuangan` | Admin, Pengurus |
| PUT | `/keuangan/:id` | Admin, Pengurus |
| DELETE | `/keuangan/:id` | Admin |
| GET | `/keuangan/donasi` | Private |
| POST | `/keuangan/donasi` | Admin, Pengurus |
| DELETE | `/keuangan/donasi/:id` | Admin |

**GET /keuangan** mengembalikan `ringkasan`:
```json
"ringkasan": { "totalMasuk": 5000000, "totalKeluar": 2000000, "saldo": 3000000 }
```

**POST /keuangan:**
```json
{ "jenis": "masuk", "kategori": "kas bulanan", "jumlah": 1500000, "tanggal": "2026-01-01", "metode": "tunai", "keterangan": "Kas bulanan" }
```

**POST /keuangan/donasi** — otomatis membuat transaksi `masuk` kategori `donasi`:
```json
{ "namaDonatur": "Ahmad Fauzi", "jamaahId": "uuid-opsional", "jumlah": 500000, "tanggal": "2026-01-01", "metode": "transfer", "tujuan": "Pembangunan" }
```

**GET /keuangan/export?format=xlsx** → file download `laporan-keuangan-*.xlsx`

---

## 📦 Inventaris

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/inventaris?search=&kondisi=` | Private |
| GET | `/inventaris/statistik` | Private |
| GET | `/inventaris/:id` | Private |
| POST | `/inventaris` | Admin, Pengurus |
| PUT | `/inventaris/:id` | Admin, Pengurus |
| DELETE | `/inventaris/:id` | Admin |

**POST /inventaris:**
```json
{
  "nama": "Sajadah Premium",
  "kode": "INV-SJD-001",
  "kategori": "Perlengkapan Ibadah",
  "jumlah": 120,
  "satuan": "lembar",
  "kondisi": "baik",                     // baik|rusak_ringan|rusak_berat|hilang
  "tanggalBeli": "2025-06-01",
  "hargaBeli": 25000000,
  "estimasiNilai": 22000000,
  "lokasi": "Ruang Utama",
  "sumberDana": "Donasi jamaah"
}
```

---

## 📢 Pengumuman

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/pengumuman?search=&kategori=&prioritas=&status=` | Private |
| GET | `/pengumuman/aktif?limit=10` | Private |
| GET | `/pengumuman/:id` | Private |
| POST | `/pengumuman` | Admin, Pengurus |
| PUT | `/pengumuman/:id` | Admin, Pengurus |
| DELETE | `/pengumuman/:id` | Admin |

**POST /pengumuman:**
```json
{
  "judul": "Jadwal Tarawih",
  "isi": "Tarawih dimulai pukul 19.30 WIB...",
  "kategori": "ibadah",
  "prioritas": "tinggi",                  // tinggi|sedang|rendah
  "tanggalMulai": "2026-01-01",
  "tanggalSelesai": "2026-01-31",         // null = selamanya
  "status": "aktif"
}
```

---

## 📑 Laporan

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/laporan?jenis=` | Private |
| GET | `/laporan/:id` | Private |
| POST | `/laporan` | Admin, Pengurus |
| POST | `/laporan/generate` | Admin, Pengurus |
| DELETE | `/laporan/:id` | Admin |

**POST /laporan/generate** → download file:
```json
{
  "jenis": "keuangan",                    // keuangan|jamaah|kegiatan|inventaris|umum
  "format": "xlsx",                       // xlsx|pdf
  "periodeMulai": "2026-01-01",
  "periodeSelesai": "2026-12-31",
  "save": true,                           // simpan ke daftar laporan
  "judul": "Laporan Keuangan 2026"        // opsional
}
```

---

## 🔔 Notifikasi

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/notifikasi?limit=20` | Private |
| PUT | `/notifikasi/:id/read` | Private |
| PUT | `/notifikasi/read-all` | Private |
| POST | `/notifikasi/broadcast` | Admin |

**POST /notifikasi/broadcast:**
```json
{ "judul": "Pengumuman", "pesan": "...", "tipe": "info", "targetRole": "jamaah" }
```

---

## 📁 Files

| Method | Endpoint | Akses |
|--------|----------|-------|
| POST | `/files/upload` (multipart/form-data) | Admin, Pengurus |
| GET | `/files?kategori=&search=` | Private |
| GET | `/files/:namaFile` | Public |
| DELETE | `/files/:id` | Admin |

**POST /files/upload** — form-data:
- `file`: file (max 10MB; jpg/png/gif/webp/pdf/doc/docx/xls/xlsx)
- `kategori`: `kegiatan | keuangan | pengumuman | dokumen` (opsional)
- `referenceId`: UUID terkait (opsional)

---

## 🔍 Audit Trail

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/audit?modul=&aksi=&userId=&tanggalMulai=&tanggalSelesai=` | Admin |
| GET | `/audit/modul` | Admin |

---

## 👤 Manajemen User

| Method | Endpoint | Akses |
|--------|----------|-------|
| GET | `/users?search=&role=&status=` | Admin |
| GET | `/users/:id` | Admin |
| POST | `/users` | Admin |
| PUT | `/users/:id` | Admin |
| DELETE | `/users/:id` | Admin (tidak bisa hapus diri sendiri) |

**POST /users:**
```json
{ "nama": "Pengurus Baru", "email": "p@email.com", "password": "Password123", "role": "pengurus", "telepon": "0812xxx", "status": "aktif" }
```

---

## ❌ Health Check

### GET /api/health
```json
{ "status": "success", "message": "API Masjid Al-Mi'raj berjalan", "timestamp": "2026-09-29T..." }
```
