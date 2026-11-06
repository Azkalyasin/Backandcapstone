const fs = require('fs');
const path = require('path');
const { Pool, types } = require('pg');

// Kolom DATE dikembalikan apa adanya ('YYYY-MM-DD'), bukan objek Date (hindari geser zona waktu).
types.setTypeParser(1082, (value) => value);

let pool = null;

/**
 * Hubungkan ke PostgreSQL.
 * - DATABASE_URL diisi (mis. Supabase) -> pakai itu.
 * - Kosong & bukan production -> database in-memory (pg-mem), data hilang saat server mati,
 *   supaya backend bisa langsung dicoba tanpa install apa pun.
 */
async function connectDB() {
  const url = process.env.DATABASE_URL;

  if (url) {
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    pool = new Pool({
      connectionString: url,
      // Supabase mewajibkan SSL.
      ssl: isLocal || process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
    });
    const { rows } = await pool.query('SELECT current_database() AS db');
    console.log(`PostgreSQL terhubung: ${rows[0].db}`);
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL wajib diisi di production.');
    }
    const { newDb } = require('pg-mem');
    const mem = newDb();
    const { Pool: MemPool } = mem.adapters.createPg();
    pool = new MemPool();
    pool.isMemory = true;
    console.warn('⚠️  DATABASE_URL kosong — memakai database in-memory (data hilang saat server berhenti).');
  }

  await initSchema();
}

/** Buat tabel jika belum ada (sql/schema.sql). */
async function initSchema() {
  let sql = fs.readFileSync(path.join(__dirname, '../../sql/schema.sql'), 'utf8');
  if (pool.isMemory) {
    // pg-mem tidak mendukung RLS & CREATE INDEX IF NOT EXISTS; abaikan baris tersebut saat dev.
    sql = sql
      .split('\n')
      .filter((line) => !/ROW LEVEL SECURITY|CREATE INDEX/.test(line))
      .join('\n');
  }
  // Hapus komentar lalu jalankan per pernyataan.
  const statements = sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

function query(text, params) {
  if (!pool) throw new Error('Database belum terhubung.');
  return pool.query(text, params);
}

function isConnected() {
  return Boolean(pool);
}

async function disconnectDB() {
  if (pool) await pool.end();
  pool = null;
}

module.exports = { connectDB, disconnectDB, query, isConnected };
