# Backend Bimbel Wanda

REST API untuk website Bimbel Wanda, dibuat dengan **Express.js 5 + Supabase (PostgreSQL)**.

| Bagian | Teknologi | Biaya |
| --- | --- | --- |
| Server API | Express.js di **Render** (Web Service Free) | Gratis |
| Database | **Supabase** PostgreSQL (500 MB) | Gratis |
| Foto prestasi | **Supabase Storage** (1 GB) | Gratis |
| Frontend | Next.js di **Vercel** (Hobby) | Gratis |

## Menjalankan di komputer sendiri

```bash
cd backend
npm install
npm run dev
```

Tanpa konfigurasi apa pun, server langsung jalan di `http://localhost:5000` dengan
**database in-memory**: data contoh otomatis terisi, tetapi hilang saat server dimatikan.
Akun admin dev: `admin` / `admin12345`.

Supaya data tersimpan permanen, salin `.env.example` menjadi `.env` lalu isi `DATABASE_URL`
dengan connection string Supabase (lihat langkah 1 di bawah). Tabel dibuat otomatis saat server start.

Jalankan uji otomatis semua endpoint:

```bash
npm test
```

Untuk menguji ke PostgreSQL asli, pakai database **kosong khusus tes** (bukan database production):
`TEST_DATABASE_URL=postgresql://... npm test`

## Struktur

```
sql/schema.sql           # Definisi tabel (dijalankan otomatis, bisa juga ditempel di SQL Editor Supabase)
src/
├── app.js               # Konfigurasi Express (CORS, JSON, routes, error handler)
├── server.js            # Entry point: konek DB → buat tabel → seed → listen
├── config/db.js         # Koneksi PostgreSQL (Supabase / in-memory saat dev)
├── models/              # Query SQL per tabel: Admin, Program, Achievement, Pendaftar, Pesan
├── controllers/         # Logika tiap fitur
├── routes/              # Definisi endpoint + validasi input
├── middlewares/         # auth (JWT) & validate
├── utils/               # format respons, Supabase Storage, notifikasi Telegram
└── seed/                # Akun admin pertama & data contoh
test/api.test.js         # Uji integrasi semua endpoint
```

## Struktur tabel

```
admins        (id, username UNIQUE, password [bcrypt], name, email, created_at, updated_at)
programs      (id, nama, deskripsi, tingkat, durasi, jadwal, biaya, kuota, tersedia, materi, fasilitas, ...)
achievements  (id, nama_siswa, judul, deskripsi, kategori, tahun, tanggal, foto, ...)
pendaftar     (id, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, telepon, email,
               nama_orang_tua, jenjang, program, program_id → programs.id, pesan, status, ...)
pesan         (id, nama, kontak, pesan, dibaca, ...)
```

Relasi: `pendaftar.program_id` → `programs.id` (ON DELETE SET NULL; nama program tetap tersimpan
di kolom `program` walau programnya dihapus). Status pendaftar dibatasi `Baru` / `Dihubungi` / `Selesai`.

## Endpoint

Semua respons berformat `{ status, message?, data? }`. Endpoint 🔒 butuh header
`Authorization: Bearer <token>` dari `POST /api/auth/login`.

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/health` | Cek server & database |
| POST | `/api/auth/login` | Login admin → token JWT |
| GET 🔒 | `/api/auth/profile` | Profil admin |
| PUT 🔒 | `/api/auth/password` | Ganti password (`passwordLama`, `passwordBaru`) |
| GET | `/api/programs` | Daftar program (`?search=&tingkat=&page=&limit=`) |
| GET | `/api/programs/:id` | Detail program |
| POST/PUT/DELETE 🔒 | `/api/programs[/:id]` | Kelola program |
| GET | `/api/achievements` | Daftar prestasi (`?search=&kategori=`) |
| GET | `/api/achievements/:id` | Detail prestasi |
| POST/PUT/DELETE 🔒 | `/api/achievements[/:id]` | Kelola prestasi (foto dikirim sebagai data URL ≤ 1 MB → di-upload ke Supabase Storage) |
| POST | `/api/pendaftar` | Kirim pendaftaran online |
| GET 🔒 | `/api/pendaftar` | Daftar pendaftar (`?status=&search=`) |
| PUT 🔒 | `/api/pendaftar/:id/status` | Ubah status: `Baru` / `Dihubungi` / `Selesai` |
| DELETE 🔒 | `/api/pendaftar/:id` | Hapus pendaftar |
| POST | `/api/pesan` | Kirim pesan dari form kontak |
| GET 🔒 | `/api/pesan` | Daftar pesan masuk |
| GET 🔒 | `/api/stats` | Ringkasan angka untuk dashboard |

Keamanan yang sudah ada: password di-hash (bcrypt), JWT, validasi input semua endpoint,
query SQL berparameter (aman dari SQL injection), pembatasan percobaan login (10x/15 menit),
anti-spam untuk form publik, CORS dibatasi ke domain frontend, dan Row Level Security aktif di semua
tabel sehingga data tidak bisa diakses langsung lewat API publik Supabase (hanya lewat backend ini).

---

## Deploy gratis (± 20 menit)

### 1. Database & Storage — Supabase

1. Daftar di <https://supabase.com> (bisa login pakai GitHub) → **New project**.
2. Isi nama project, buat **Database Password** (simpan baik-baik), region **Southeast Asia (Singapore)**.
3. Setelah project siap, klik tombol **Connect** di atas → tab **Connection string** →
   pilih **Session pooler** → salin URI dan ganti `[YOUR-PASSWORD]` dengan password tadi.
   Ini nilai `DATABASE_URL`.
   > Pakai **Session pooler**, bukan *Direct connection*: koneksi langsung Supabase hanya lewat IPv6,
   > sedangkan Render gratis hanya mendukung IPv4.
4. Buka **Project Settings → API**, salin:
   - **Project URL** → `SUPABASE_URL`
   - kunci **service_role** (klik *Reveal*) → `SUPABASE_SERVICE_ROLE_KEY`.
     Kunci ini **rahasia**: hanya untuk backend, jangan pernah ditaruh di frontend atau di-commit.
5. Tidak perlu membuat tabel atau bucket manual — backend membuat tabel (`sql/schema.sql`) dan
   bucket Storage `achievements` otomatis saat pertama kali jalan.

### 2. Backend — Render

1. Push folder `backend` ke GitHub.
2. Daftar di <https://render.com> (login pakai GitHub).
3. **New → Blueprint** → pilih repo backend (otomatis membaca `render.yaml`).
   Atau **New → Web Service** dengan: Build `npm ci --omit=dev`, Start `npm start`, plan **Free**.
4. Isi Environment Variables:
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` → dari langkah 1
   - `ADMIN_PASSWORD` → password admin (min. 8 karakter, jangan yang mudah ditebak)
   - `CORS_ORIGIN` → URL frontend Vercel, contoh `https://bimbel-wanda.vercel.app`
   - `JWT_SECRET` → dibuat otomatis oleh blueprint (jika manual, isi string acak panjang)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` → opsional, untuk notifikasi admin
5. Setelah deploy selesai, buka `https://NAMA-SERVICE.onrender.com/api/health` → harus `"database": "connected"`.
   Cek juga di Supabase → **Table Editor**: tabel `programs`, `pendaftar`, dll. sudah muncul.

### 3. Frontend — Vercel

1. Push folder `frontend` ke GitHub, lalu import di <https://vercel.com/new>.
2. Environment Variables:
   - `NEXT_PUBLIC_API_URL` → `https://NAMA-SERVICE.onrender.com/api`
   - `NEXT_PUBLIC_WA_NUMBER`, `NEXT_PUBLIC_TELEGRAM_USERNAME`, dll. (lihat `frontend/.env.example`)
3. Deploy. Jangan lupa isi URL Vercel ke `CORS_ORIGIN` di Render.

### Batasan paket gratis & cara mengatasinya

| Layanan | Batasan | Solusi |
| --- | --- | --- |
| Render Free | Server tidur setelah 15 menit tanpa akses; akses pertama ±30–50 detik | Ping `/api/health` berkala |
| Supabase Free | Project di-*pause* jika 7 hari tidak ada aktivitas | Ping `/api/health` berkala (endpoint ini menjalankan query ke database). Project yang ter-pause bisa di-*restore* dari dashboard tanpa kehilangan data |

Ping berkala gratis: daftar di <https://cron-job.org>, buat job ke
`https://NAMA-SERVICE.onrender.com/api/health` setiap 10 menit. Satu job ini menjaga Render tetap bangun
sekaligus membuat Supabase tetap aktif.
