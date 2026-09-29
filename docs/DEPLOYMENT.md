# 🚀 Panduan Deployment — Masjid Al-Mi'raj

Panduan lengkap deploy **frontend** dan **backend** ke Vercel / Netlify, serta catatan
penting soal file storage di environment serverless.

---

## 📋 Checklist Sebelum Deploy

- [ ] Database Neon sudah dibuat & migrasi sudah dijalankan (`npm run db:migrate`)
- [ ] Seeder sudah dijalankan (`npm run db:seed`) — atau buat admin manual via API
- [ ] `JWT_SECRET` & `JWT_REFRESH_SECRET` sudah digenerate (bukan placeholder)
- [ ] Password default sudah diganti
- [ ] `COOKIE_SECURE=true` (karena production HTTPS)

---

## ☁️ Opsi A: Vercel (Rekomendasi)

### Langkah 1 — Deploy Backend

1. Push project ke GitHub/GitLab.
2. Buka [vercel.com](https://vercel.com) → **Add New Project**.
3. Import repository → **Root Directory**: pilih folder `backend`.
   *(Vercel akan otomatis mendeteksi `vercel.json`)*
4. Buka **Settings → Environment Variables**, tambahkan:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgres://...neon.tech/neondb?sslmode=require` |
   | `JWT_SECRET` | *(secret acak 64+ karakter)* |
   | `JWT_REFRESH_SECRET` | *(secret acak lain)* |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://frontend-anda.vercel.app` |
   | `COOKIE_SECURE` | `true` |
   | `PORT` | *(kosongkan, Vercel otomatis)* |

5. **Deploy**. Tunggu hingga selesai, catat URL: `https://backend-anda.vercel.app`.
6. Test: buka `https://backend-anda.vercel.app/api/health` → harus respons JSON.

### Langkah 2 — Deploy Frontend

1. **Add New Project** → import repository yang sama.
2. **Root Directory**: pilih folder `frontend`.
3. Environment Variables:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://backend-anda.vercel.app/api` |

4. **Deploy**. Buka URL frontend → harus muncul halaman login.

### Langkah 3 — Update CORS Backend

Set frontend live, update `CLIENT_URL` di backend Vercel dengan URL frontend final,
lalu **Redeploy** backend.

---

## 🟩 Opsi B: Netlify

### Backend

1. Buka [netlify.com](https://netlify.com) → **Add new site → Import**.
2. Pilih repository, atur:
   - **Base directory**: `backend`
   - **Build command**: `npm install`
   - **Publish directory**: *(kosong)*
   - **Functions directory**: `backend/netlify/functions` (perlu adaptasi — lihat catatan)
3. Environment variables: sama seperti Vercel (di **Site settings → Environment variables**).

> ⚠️ **Netlify Functions**: Netlify menggunakan format functions berbeda. Konversi
> Express app ke Netlify Function dibutuhkan (mis. `serverless-http`). Untuk kemudahan,
> **Vercel lebih direkomendasikan** untuk stack ini.

### Frontend

1. Import repository → **Base directory**: `frontend`.
2. **Build command**: `npm run build`
3. **Publish directory**: `frontend/dist`
4. Env var: `VITE_API_URL` = URL backend.
5. **Deploy site**.

---

## 💡 Opsi C: VPS / Self-hosted (Render, Railway, VPS)

Paling disarankan jika ingin fitur **upload file** berfungsi penuh (filesystem writable).

```bash
# Backend
cd backend
npm install
npm start          # jalankan dengan PM2/reverse proxy nginx

# Frontend
cd frontend
npm install
npm run build      # hasilnya di dist/
# Serve dist/ lewat nginx, dengan proxy /api -> backend
```

Contoh konfigurasi nginx:

```nginx
server {
    listen 80;
    server_name masjid.sch.id;

    # Frontend (static build)
    location / {
        root /var/www/masjid-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ke backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🗄️ Database Neon: Setup & Production Tips

1. Buat project di [neon.tech](https://neon.tech) (free tier: 0.5 GB, cukup untuk awal).
2. Pilih region terdekat dengan user (Singapore untuk Indonesia).
3. **Gunakan pooled connection string** (URL mengandung `-pooler`) untuk API serverless.
4. Set environment variable `DATABASE_URL` dengan `?sslmode=require` di akhir.
5. Untuk backup: gunakan fitur **Neon branching** atau export via SQL Editor.

### Migrasi di production

```bash
# Set DATABASE_URL production, lalu:
npm --prefix backend run db:migrate
npm --prefix backend run db:seed   # sekali saja, untuk data awal
```

Atau: copy-paste `database/migrations/001_init.sql` ke **Neon SQL Editor**.

---

## 📁 Catatan Penting: File Storage di Serverless

**Vercel & Netlify** menggunakan filesystem **read-only** (kecuali `/tmp` sementara).
Artinya fitur upload file (`POST /files/upload`) **tidak akan persist** di serverless murni.

### Solusi 1: Cloud Storage (Rekomendasi production)

Gunakan Cloudinary / AWS S3 / Cloudflare R2:

1. Install SDK, mis: `npm i cloudinary`
2. Tambah env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. Modifikasi `backend/src/middlewares/upload.js`:

```js
// Contoh integrasi Cloudinary (pseudo-code)
if (config.useCloudStorage) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  // gunakan multer-storage-cloudinary alih-alih diskStorage
}
```

4. Set `USE_CLOUD_STORAGE=true` di env.

### Solusi 2: Deploy backend di VPS (Render/Railway/VPS)

File tersimpan di disk server → fitur upload langsung berfungsi tanpa modifikasi.

---

## 🔒 Keamanan di Production

Pastikan konfigurasi berikut saat deploy:

| Item | Production value |
|------|------------------|
| `NODE_ENV` | `production` |
| `COOKIE_SECURE` | `true` (HTTPS) |
| `JWT_SECRET` | secret acak 64+ karakter (bukan placeholder!) |
| `JWT_REFRESH_SECRET` | secret acak lain |
| `CLIENT_URL` | URL frontend final (jangan `localhost`) |
| `RATE_LIMIT_MAX` | turunkan jika perlu (mis. 100/15menit) |
| Password default | **WAJIB diganti** setelah login pertama |

Juga disarankan:
- Setup **HTTPS** (Vercel/Netlify otomatis; VPS via Let's Encrypt)
- Aktifkan **2FA** di akun GitHub/Vercel/Neon
- Backup database Neon berkala
- Monitor logs (Vercel dashboard / `logs/` di VPS)

---

## ✅ Verifikasi Setelah Deploy

1. `GET /api/health` → status `success`
2. Login dengan akun admin → dapat `accessToken`
3. `GET /api/dashboard` (dengan Bearer token) → data statistik
4. Buka frontend → login → dashboard tampil dengan grafik
5. Test upload file (jika pakai cloud storage/VPS)
6. Ganti password default!

---

## 🆘 Masalah Umum

**CORS error setelah deploy**
→ Pastikan `CLIENT_URL` backend cocok **persis** dengan URL frontend (termasuk `https://`).

**"Unauthorized" terus-menerus**
→ Cek `COOKIE_SECURE` & apakah browser memblokir third-party cookies. Pertimbangkan kirim
   refresh token via body (sudah didukung: `refreshToken` field).

**Database connection limit**
→ Pakai pooled connection (`-pooler` di URL Neon) & kurangi `max` pool di `db.js` bila perlu.

**Build frontend gagal**
→ Pastikan Node >= 18 dan hapus `node_modules` + `package-lock.json`, lalu `npm install` ulang.
