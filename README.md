# 🕌 Sistem Manajemen Pengelolaan Masjid Al-Mi'raj

Platform digital terintegrasi untuk pengelolaan administrasi masjid: data jamaah, jadwal sholat, kegiatan, keuangan (kas & donasi), inventaris, pengumuman, pelaporan, dan audit trail.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20Neon%20PostgreSQL-0B6E4F?style=for-the-badge)

---

## 📋 Daftar Isi

- [Teknologi](#-teknologi)
- [Fitur Utama](#-fitur-utama)
- [Struktur Project](#-struktur-project)
- [Persiapan / Prasyarat](#-persiapan--prasyarat)
- [Instalasi & Menjalankan](#-instalasi--menjalankan)
- [Database (Neon PostgreSQL)](#-database-neon-postgresql)
- [Akun Default](#-akun-default)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Role & Hak Akses (RBAC)](#-role--hak-akses-rbac)
- [Keamanan](#-keamanan)
- [Deployment](#-deployment)
- [Dokumentasi Tambahan](#-dokumentasi-tambahan)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Teknologi

| Bagian | Teknologi |
|--------|-----------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query, Zustand, React Hook Form + Zod, Recharts, React Hot Toast, Lucide Icons |
| **Backend** | Node.js (Express 4), PostgreSQL via `pg` (Neon), JWT (access + refresh token), Bcryptjs, Multer, Express-validator, Helmet, Morgan, Winston |
| **Database** | [Neon](https://neon.tech) — PostgreSQL serverless |
| **Export** | PDFKit (PDF), ExcelJS (Excel) |
| **Deployment** | Vercel / Netlify (frontend + serverless API) |

---

## ✨ Fitur Utama

- 📊 **Dashboard** — statistik lengkap dengan grafik pemasukan/pengeluaran & donasi
- 👥 **Manajemen Jamaah** — CRUD data anggota dengan pencarian, filter & pagination
- 🕐 **Jadwal Sholat** — jadwal harian + input banyak sekaligus (bulk)
- 📅 **Kegiatan** — CRUD event + tampilan **kalender bulanan**
- 💰 **Keuangan** — transaksi kas masuk/keluar, **donasi terintegrasi**, export PDF/Excel
- 📦 **Inventaris** — manajemen aset + estimasi nilai & kondisi
- 📢 **Pengumuman** — publikasi dengan prioritas & masa berlaku
- 📑 **Laporan** — generator laporan PDF/Excel per jenis & periode
- 🔍 **Audit Trail** — riwayat seluruh aksi kritis (transaksi, CRUD, login)
- 🔐 **Autentikasi** — login/register, JWT + refresh token rotation, RBAC
- 🔔 **Notifikasi** — broadcast & notifikasi per user
- 📁 **File Management** — upload/download dokumentasi & foto kegiatan

---

## 📁 Struktur Project

```
masjid-al-miraj/
├── backend/                     # RESTful API (Express)
│   ├── src/
│   │   ├── config/              # env.js, db.js (koneksi Neon)
│   │   ├── controllers/         # Logika tiap modul
│   │   ├── middlewares/         # auth, error, rateLimiter, upload, validate
│   │   ├── routes/              # Definisi endpoint
│   │   ├── services/            # export.service.js (PDF/Excel)
│   │   ├── utils/               # ApiError, token, audit, logger, seedDb, migrateDb
│   │   ├── validators/          # Schema validasi (express-validator)
│   │   ├── app.js               # Konfigurasi Express app
│   │   └── server.js            # Entry point
│   ├── uploads/                 # File upload (dev/self-hosted)
│   ├── .env.example
│   └── vercel.json
├── frontend/                    # Web app (React + Vite)
│   ├── src/
│   │   ├── components/          # ui/, layout/, common/, dashboard/
│   │   ├── pages/               # Semua halaman (lazy-loaded)
│   │   ├── services/            # api.js (axios) + endpoints.js
│   │   ├── store/               # Zustand (authStore)
│   │   └── utils/               # cn, format, constants
│   ├── public/
│   ├── .env.example
│   └── vite.config.js
├── database/
│   ├── migrations/              # 001_init.sql (schema)
│   └── seeds/                   # 001_seed_data.sql
├── docs/                        # Dokumentasi tambahan
├── .gitignore
└── README.md
```

---

## 📦 Persiapan / Prasyarat

Pastikan terinstall di komputer Anda:

- **Node.js** `>= 18.0.0` — [download](https://nodejs.org)
- **npm** `>= 9` (sudah paket dengan Node.js)
- **Akun [Neon](https://neon.tech)** (free tier tersedia) untuk database PostgreSQL
- **Git** untuk cloning

---

## 🔧 Instalasi & Menjalankan

### 1. Clone repository

```bash
git clone <url-repo-anda>.git
cd masjid-al-miraj
```

### 2. Install seluruh dependencies

```bash
# Install backend & frontend sekaligus
npm run install:all
```

Atau manual:

```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 3. Setup environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` dan isi `DATABASE_URL` dari dashboard Neon:
*(Dashboard Neon → project Anda → Connection string → copy)*

```env
DATABASE_URL=postgres://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=<generate_secret_acak>
JWT_REFRESH_SECRET=<generate_secret_acak_lain>
```

> 💡 Generate secret aman:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Jalankan migrasi database

```bash
npm run db:migrate
```

### 5. Jalankan seeder (data contoh + akun default)

```bash
npm run db:seed
```

### 6. Jalankan aplikasi (mode development)

```bash
# Backend (port 5000)
npm run dev:backend

# Frontend (port 5173) — buka terminal baru
npm run dev:frontend
```

Buka **[http://localhost:5173](http://localhost:5173)** di browser. Selesai! 🎉

> Frontend otomatis me-proxy request `/api` ke `http://localhost:5000` (lihat `vite.config.js`), sehingga tidak ada masalah CORS saat development.

---

## 🗄 Database (Neon PostgreSQL)

### Migrasi

File `database/migrations/001_init.sql` membuat:

| Tabel | Keterangan |
|-------|------------|
| `users` | Akun autentikasi (email, password bcrypt, role) |
| `jamaah` | Data anggota jamaah (relasi opsional ke `users`) |
| `jadwal_sholat` | Jadwal sholat harian + imam/khotib |
| `kegiatan` | Agenda/acara masjid |
| `keuangan` | Transaksi kas masuk/keluar |
| `donasi` | Donasi (ter-link ke `keuangan`) |
| `inventaris` | Aset & perlengkapan |
| `pengumuman` | Pengumuman dengan prioritas & masa berlaku |
| `laporan` | Riwayat laporan yang dibuat |
| `audit_logs` | Audit trail aksi kritis |
| `notifikasi` | Notifikasi user/broadcast |
| `files` | Registry file yang diupload |

Semua tabel dilengkapi:
- ✅ **Primary key** UUID (`gen_random_uuid()`)
- ✅ **Foreign keys** dengan `ON DELETE SET NULL/CASCADE`
- ✅ **Index** pada kolop yang sering di-query (GIN trigram untuk pencarian)
- ✅ **Trigger `updated_at`** otomatis
- ✅ **CHECK constraints** (jumlah > 0, periode valid, dll)

### Menjalankan via Neon SQL Editor

Buka dashboard Neon → SQL Editor, lalu jalankan:
1. `database/migrations/001_init.sql`
2. `database/seeds/001_seed_data.sql` (opsional, butuh minimal 1 admin)

---

## 🔑 Akun Default

Setelah `npm run db:seed`, akun berikut tersedia (**GANTI PASSWORD SEGERA setelah login pertama!**):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@masjidalmiraj.sch.id` | `admin12345` |
| **Pengurus** | `pengurus@masjidalmiraj.sch.id` | `pengurus12345` |
| **Jamaah** | `jamaah@masjidalmiraj.sch.id` | `jamaah12345` |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | ✅ | Connection string Neon PostgreSQL |
| `JWT_SECRET` | ✅ | Secret untuk access token |
| `JWT_REFRESH_SECRET` | ✅ | Secret untuk refresh token |
| `NODE_ENV` | ❌ | `development` / `production` |
| `PORT` | ❌ | Default `5000` |
| `CLIENT_URL` | ❌ | URL frontend untuk CORS |
| `JWT_EXPIRES_IN` | ❌ | Default `2h` |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | Default `7d` |
| `COOKIE_SECURE` | ❌ | `true` jika HTTPS |
| `UPLOAD_DIR` | ❌ | Default `uploads` |
| `MAX_FILE_SIZE` | ❌ | Default 10MB |
| `RATE_LIMIT_MAX` | ❌ | Default 300 req / 15 menit |

### Frontend (`frontend/.env`)

| Variable | Keterangan |
|----------|------------|
| `VITE_API_URL` | Base URL API. Development: `/api`. Production: URL lengkap backend |

---

## 🌐 API Endpoints

Base URL: `http://localhost:5000/api`

Detail lengkap: **[docs/API.md](docs/API.md)**

| Modul | Method | Endpoint | Akses |
|-------|--------|----------|-------|
| **Auth** | POST | `/auth/register` | Public |
| | POST | `/auth/login` | Public |
| | POST | `/auth/logout` | Public |
| | POST | `/auth/refresh` | Public |
| | GET | `/auth/me` | Private |
| | PUT | `/auth/me` | Private |
| | PUT | `/auth/change-password` | Private |
| **Dashboard** | GET | `/dashboard` | Private |
| **Jamaah** | GET/POST | `/jamaah` | Private / Admin+Pengurus |
| | GET/PUT/DELETE | `/jamaah/:id` | Private / Admin+Pengurus / Admin |
| | GET | `/jamaah/statistik` | Private |
| **Jadwal Sholat** | GET | `/jadwal`, `/jadwal/today` | Private |
| | POST | `/jadwal`, `/jadwal/bulk` | Admin+Pengurus |
| | PUT/DELETE | `/jadwal/:id` | Admin+Pengurus / Admin |
| **Kegiatan** | GET | `/kegiatan`, `/kegiatan/calendar`, `/kegiatan/berlangsung` | Private |
| | POST/PUT/DELETE | `/kegiatan/:id` | Admin+Pengurus / Admin |
| **Keuangan** | GET | `/keuangan`, `/keuangan/statistik`, `/keuangan/export` | Private / Admin+Pengurus |
| | POST/PUT/DELETE | `/keuangan/:id` | Admin+Pengurus / Admin |
| | GET/POST | `/keuangan/donasi` | Private / Admin+Pengurus |
| | DELETE | `/keuangan/donasi/:id` | Admin |
| **Inventaris** | GET | `/inventaris`, `/inventaris/statistik` | Private |
| | POST/PUT/DELETE | `/inventaris/:id` | Admin+Pengurus / Admin |
| **Pengumuman** | GET | `/pengumuman`, `/pengumuman/aktif` | Private |
| | POST/PUT/DELETE | `/pengumuman/:id` | Admin+Pengurus / Admin |
| **Laporan** | GET | `/laporan` | Private |
| | POST | `/laporan/generate` | Admin+Pengurus |
| | POST/DELETE | `/laporan/:id` | Admin+Pengurus / Admin |
| **Notifikasi** | GET | `/notifikasi` | Private |
| | PUT | `/notifikasi/:id/read`, `/notifikasi/read-all` | Private |
| | POST | `/notifikasi/broadcast` | Admin |
| **Files** | POST | `/files/upload` | Admin+Pengurus |
| | GET | `/files`, `/files/:namaFile` | Private / Public |
| | DELETE | `/files/:id` | Admin |
| **Audit** | GET | `/audit`, `/audit/modul` | Admin |
| **Users** | GET/POST | `/users` | Admin |
| | GET/PUT/DELETE | `/users/:id` | Admin |

---

## 👤 Role & Hak Akses (RBAC)

| Fitur | Admin | Pengurus | Jamaah |
|-------|:-----:|:--------:|:------:|
| Lihat dashboard & statistik | ✅ | ✅ | ✅ |
| Lihat jadwal sholat & kegiatan | ✅ | ✅ | ✅ |
| Lihat pengumuman | ✅ | ✅ | ✅ |
| Tambah/edit/hapus jamaah | ✅ | ✅ | ❌ |
| Kelola keuangan & donasi | ✅ | ✅ | ❌ |
| Kelola inventaris | ✅ | ✅ | ❌ |
| Buat pengumuman | ✅ | ✅ | ❌ |
| Generate laporan | ✅ | ✅ | ❌ |
| Lihat audit trail | ✅ | ❌ | ❌ |
| Manajemen user | ✅ | ❌ | ❌ |
| Hapus data | ✅ | ❌ | ❌ |

---

## 🔒 Keamanan

Implementasi keamanan yang sudah diterapkan:

- ✅ **Password hashing** dengan bcrypt (12 rounds)
- ✅ **JWT** access token (2 jam) + **refresh token rotation** (7 hari) di httpOnly cookie
- ✅ **Role-based access control** (RBAC) di setiap endpoint
- ✅ **Parameterized queries** (anti SQL injection) di seluruh query
- ✅ **Input validation & sanitization** dengan express-validator
- ✅ **CORS configuration** whitelist origin
- ✅ **Helmet** untuk security headers (XSS, clickjacking, dll)
- ✅ **Rate limiting** global + khusus endpoint auth (anti brute force)
- ✅ **HPP** (HTTP Parameter Pollution protection)
- ✅ **File upload filtering** (ekstensi & MIME type whitelist)
- ✅ **Environment variables** untuk semua secret
- ✅ **Audit trail** untuk transaksi & aksi kritis
- ✅ **Graceful shutdown** & error handling terpusat

---

## ☁️ Deployment

Panduan lengkap: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

### Quick start (Vercel)

**Backend:**
1. Import folder `backend` ke Vercel
2. Set environment variables di dashboard Vercel
3. Deploy → dapatkan URL API

**Frontend:**
1. Import folder `frontend` ke Vercel
2. Set `VITE_API_URL` = URL backend yang sudah dideploy
3. Deploy → selesai

> ⚠️ **Catatan Vercel/Netlify**: filesystem serverless bersifat **read-only** (kecuali `/tmp`).
> Untuk upload file di production, gunakan storage eksternal (Cloudinary/R2/S3) —
> set `USE_CLOUD_STORAGE=true` dan integrasikan di `middlewares/upload.js`.

---

## 📚 Dokumentasi Tambahan

- 📖 **[docs/API.md](docs/API.md)** — detail request/response API
- 🚀 **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — panduan deploy Vercel/Netlify
- 🗄️ **[database/migrations/001_init.sql](database/migrations/001_init.sql)** — schema database

---

## 🩺 Troubleshooting

<details>
<summary><b>Klik untuk melihat FAQ</b></summary>

**Q: Error "DATABASE_URL belum diset!"**
A: Salin `backend/.env.example` menjadi `backend/.env` dan isi connection string Neon.

**Q: Login gagal padahal password benar**
A: Pastikan Anda sudah menjalankan `npm run db:seed`. Gunakan akun default di atas.

**Q: Frontend error CORS saat production**
A: Set `CLIENT_URL` di backend `.env` dengan URL frontend, dan `VITE_API_URL` di frontend dengan URL backend.

**Q: Port 5000/5173 sudah dipakai**
A: Ubah `PORT` di `backend/.env` dan `server.port` di `frontend/vite.config.js`.

**Q: Migration gagal di Neon**
A: Pastikan connection string menggunakan **pooled connection** (URL dengan `-pooler`), dan `sslmode=require` ada.

**Q: Upload file tidak berhasil di Vercel**
A: Vercel filesystem read-only. Gunakan storage eksternal (lihat catatan di bagian Deployment).

</details>

---

## 📜 Lisensi

MIT License — bebas digunakan dan dikembangkan untuk kepentingan masjid/komunitas.

---

## 🤲 Doa Penutup

> *"Semoga Allah memberkahi kalian semua dan menjadikan kalian orang-orang yang bermanfaat untuk umat."*

**Selamat menggunakan!** Jika ada pertanyaan atau butuh bantuan, silakan periksa dokumentasi atau hubungi tim pengembang.
