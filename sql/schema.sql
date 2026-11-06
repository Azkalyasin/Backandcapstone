-- Skema database Bimbel Wanda (PostgreSQL / Supabase).
-- Dijalankan otomatis oleh server saat start (aman diulang karena memakai IF NOT EXISTS).
-- Bisa juga ditempel manual di Supabase > SQL Editor.

CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(100) NOT NULL,
  name        VARCHAR(100) NOT NULL DEFAULT 'Administrator',
  email       VARCHAR(120) NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
  id          SERIAL PRIMARY KEY,
  nama        VARCHAR(120) NOT NULL,
  deskripsi   TEXT         NOT NULL DEFAULT '',
  tingkat     VARCHAR(30)  NOT NULL,
  durasi      VARCHAR(50)  NOT NULL DEFAULT '',
  jadwal      VARCHAR(120) NOT NULL DEFAULT '',
  biaya       INTEGER      NOT NULL DEFAULT 0 CHECK (biaya >= 0),
  kuota       INTEGER      NOT NULL DEFAULT 0 CHECK (kuota >= 0),
  tersedia    BOOLEAN      NOT NULL DEFAULT TRUE,
  materi      JSONB        NOT NULL DEFAULT '[]',
  fasilitas   JSONB        NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id          SERIAL PRIMARY KEY,
  nama_siswa  VARCHAR(120) NOT NULL,
  judul       VARCHAR(200) NOT NULL,
  deskripsi   TEXT         NOT NULL DEFAULT '',
  kategori    VARCHAR(50)  NOT NULL DEFAULT 'Akademik',
  tahun       INTEGER,
  tanggal     DATE,
  -- URL foto di Supabase Storage (atau data URL jika Storage belum dikonfigurasi)
  foto        TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pendaftar (
  id              SERIAL PRIMARY KEY,
  nama            VARCHAR(120) NOT NULL,
  tempat_lahir    VARCHAR(80)  NOT NULL DEFAULT '',
  tanggal_lahir   DATE,
  jenis_kelamin   VARCHAR(20)  NOT NULL DEFAULT '',
  alamat          TEXT         NOT NULL DEFAULT '',
  telepon         VARCHAR(30)  NOT NULL,
  email           VARCHAR(120) NOT NULL DEFAULT '',
  nama_orang_tua  VARCHAR(120) NOT NULL DEFAULT '',
  jenjang         VARCHAR(30)  NOT NULL DEFAULT '',
  program         VARCHAR(120) NOT NULL DEFAULT '',
  program_id      INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  pesan           TEXT         NOT NULL DEFAULT '',
  status          VARCHAR(20)  NOT NULL DEFAULT 'Baru' CHECK (status IN ('Baru', 'Dihubungi', 'Selesai')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pesan (
  id          SERIAL PRIMARY KEY,
  nama        VARCHAR(100) NOT NULL,
  kontak      VARCHAR(100) NOT NULL,
  pesan       TEXT         NOT NULL,
  dibaca      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pendaftar_status ON pendaftar (status);
CREATE INDEX IF NOT EXISTS idx_pendaftar_created ON pendaftar (created_at);

-- Supabase mengaktifkan API publik (PostgREST) untuk schema "public".
-- Karena semua akses lewat backend Express, aktifkan RLS tanpa policy
-- agar tabel tidak bisa dibaca/diubah langsung lewat anon key.
ALTER TABLE admins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftar    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesan        ENABLE ROW LEVEL SECURITY;
