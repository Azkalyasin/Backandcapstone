const { query } = require('../config/db');
const { toDateStr, toIso, likePattern, buildInsert, buildUpdate } = require('./helpers');

const FIELDS = {
  namaSiswa: 'nama_siswa',
  judul: 'judul',
  deskripsi: 'deskripsi',
  kategori: 'kategori',
  tahun: 'tahun',
  tanggal: 'tanggal',
  foto: 'foto',
};
const TRANSFORM = { tanggal: (v) => v || null };

function toJSON(row) {
  return {
    id: row.id,
    namaSiswa: row.nama_siswa,
    judul: row.judul,
    deskripsi: row.deskripsi,
    kategori: row.kategori,
    tahun: row.tahun,
    tanggal: toDateStr(row.tanggal),
    foto: row.foto,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function buildWhere({ search, kategori }) {
  const where = [];
  const values = [];
  if (search) {
    values.push(likePattern(search));
    where.push(`(nama_siswa ILIKE $${values.length} OR judul ILIKE $${values.length})`);
  }
  if (kategori) {
    values.push(kategori);
    where.push(`kategori = $${values.length}`);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', values };
}

async function findAll(filters, { limit, skip }) {
  const { clause, values } = buildWhere(filters);
  const [list, total] = await Promise.all([
    query(
      `SELECT * FROM achievements ${clause} ORDER BY tanggal DESC NULLS LAST, id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, skip],
    ),
    query(`SELECT COUNT(*) AS total FROM achievements ${clause}`, values),
  ]);
  return { items: list.rows.map(toJSON), total: Number(total.rows[0].total) };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM achievements WHERE id = $1', [id]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function create(data) {
  const { text, values } = buildInsert('achievements', data, FIELDS, TRANSFORM);
  const { rows } = await query(text, values);
  return toJSON(rows[0]);
}

async function update(id, data) {
  const { text, values } = buildUpdate('achievements', id, data, FIELDS, TRANSFORM);
  const { rows } = await query(text, values);
  return rows[0] ? toJSON(rows[0]) : null;
}

/** Hapus dan kembalikan data yang dihapus (untuk membersihkan foto di Storage). */
async function remove(id) {
  const { rows } = await query('DELETE FROM achievements WHERE id = $1 RETURNING *', [id]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function count() {
  const { rows } = await query('SELECT COUNT(*) AS total FROM achievements');
  return Number(rows[0].total);
}

module.exports = { findAll, findById, create, update, remove, count };
