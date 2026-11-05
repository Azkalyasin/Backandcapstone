# Backend Bimbel Wanda

REST API untuk website Bimbel Wanda, dibuat dengan **Express.js 5 + MongoDB (Mongoose)**.

| Bagian | Teknologi | Biaya |
| --- | --- | --- |
| Server API | Express.js di **Render** (Web Service Free) | Gratis |
| Database | **MongoDB Atlas** (cluster M0, 512 MB) | Gratis selamanya |
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

Supaya data tersimpan permanen, salin `.env.example` menjadi `.env` lalu isi `MONGODB_URI`
dengan connection string MongoDB Atlas (lihat langkah 1 di bawah).

Jalankan uji otomatis semua endpoint:

```bash
npm test
```

## Struktur

```
src/
├── app.js               # Konfigurasi Express (CORS, JSON, routes, error handler)
├── server.js            # Entry point: konek DB → seed → listen
├── config/db.js         # Koneksi MongoDB (Atlas / in-memory saat dev)
├── models/              # Admin, Program, Achievement, Pendaftar, Pesan
├── controllers/         # Logika tiap fitur
├── routes/              # Definisi endpoint + validasi input
├── middlewares/         # auth (JWT) & validate
├── utils/               # format respons, notifikasi Telegram
└── seed/                # Akun admin pertama & data contoh
test/api.test.js         # Uji integrasi semua endpoint
```

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
| POST/PUT/DELETE 🔒 | `/api/achievements[/:id]` | Kelola prestasi (foto = data URL ≤ 1 MB) |
| POST | `/api/pendaftar` | Kirim pendaftaran online |
| GET 🔒 | `/api/pendaftar` | Daftar pendaftar (`?status=&search=`) |
| PUT 🔒 | `/api/pendaftar/:id/status` | Ubah status: `Baru` / `Dihubungi` / `Selesai` |
| DELETE 🔒 | `/api/pendaftar/:id` | Hapus pendaftar |
| POST | `/api/pesan` | Kirim pesan dari form kontak |
| GET 🔒 | `/api/pesan` | Daftar pesan masuk |
| GET 🔒 | `/api/stats` | Ringkasan angka untuk dashboard |

Keamanan yang sudah ada: password di-hash (bcrypt), JWT, validasi input semua endpoint,
pembatasan percobaan login (10x/15 menit), anti-spam untuk form publik, dan CORS dibatasi ke domain frontend.

---

## Deploy gratis (± 20 menit)

### 1. Database — MongoDB Atlas

1. Daftar di <https://www.mongodb.com/cloud/atlas/register>.
2. **Create cluster** → pilih **M0 (Free)**, provider AWS, region **Singapore**.
3. **Database Access** → *Add New Database User* → buat username & password (simpan).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   (Diperlukan karena IP server Render gratis berubah-ubah.)
5. **Connect** → *Drivers* → salin connection string, lalu tambahkan nama database:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/bimbel-wanda?retryWrites=true&w=majority`

### 2. Backend — Render

1. Push folder `backend` ke GitHub.
2. Daftar di <https://render.com> (login pakai GitHub).
3. **New → Blueprint** → pilih repo backend (otomatis membaca `render.yaml`).
   Atau **New → Web Service** dengan: Build `npm ci --omit=dev`, Start `npm start`, plan **Free**.
4. Isi Environment Variables:
   - `MONGODB_URI` → connection string langkah 1
   - `ADMIN_PASSWORD` → password admin (min. 8 karakter, jangan yang mudah ditebak)
   - `CORS_ORIGIN` → URL frontend Vercel, contoh `https://bimbel-wanda.vercel.app`
   - `JWT_SECRET` → dibuat otomatis oleh blueprint (jika manual, isi string acak panjang)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` → opsional, untuk notifikasi admin
5. Setelah deploy selesai, buka `https://NAMA-SERVICE.onrender.com/api/health` → harus `"database": "connected"`.

> Catatan paket gratis Render: server "tidur" setelah 15 menit tanpa akses, dan request
> pertama setelahnya butuh ±30–50 detik untuk bangun. Data tetap aman karena tersimpan di Atlas.
> Agar tidak tidur, bisa pakai layanan ping gratis seperti cron-job.org ke `/api/health` tiap 10 menit.

### 3. Frontend — Vercel

1. Push folder `frontend` ke GitHub, lalu import di <https://vercel.com/new>.
2. Environment Variables:
   - `NEXT_PUBLIC_API_URL` → `https://NAMA-SERVICE.onrender.com/api`
   - `NEXT_PUBLIC_WA_NUMBER`, `NEXT_PUBLIC_TELEGRAM_USERNAME`, dll. (lihat `frontend/.env.example`)
3. Deploy. Jangan lupa isi URL Vercel ke `CORS_ORIGIN` di Render.

### Alternatif hosting backend gratis

- **Koyeb** (free instance) — langkah mirip Render, pilih repo → build `npm ci`, run `npm start`.
- **Railway** — ada kredit percobaan, bukan gratis permanen.
