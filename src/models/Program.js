const { query } = require('../config/db');
const { toIso, toArray, likePattern, buildInsert, buildUpdate } = require('./helpers');

const FIELDS = {
  nama: 'nama',
  deskripsi: 'deskripsi',
  tingkat: 'tingkat',
  durasi: 'durasi',
  jadwal: 'jadwal',
  biaya: 'biaya',
  kuota: 'kuota',
  tersedia: 'tersedia',
  materi: 'materi',
  fasilitas: 'fasilitas',
};
const TRANSFORM = { materi: JSON.stringify, fasilitas: JSON.stringify, biaya: Math.round };

function toJSON(row) {
  return {
    id: row.id,
    nama: row.nama,
    deskripsi: row.deskripsi,
    tingkat: row.tingkat,
    durasi: row.durasi,
    jadwal: row.jadwal,
    biaya: Number(row.biaya),
    kuota: Number(row.kuota),
    tersedia: row.tersedia,
    materi: toArray(row.materi),
    fasilitas: toArray(row.fasilitas),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function buildWhere({ search, tingkat }) {
  const where = [];
  const values = [];
  if (search) {
    values.push(likePattern(search));
    where.push(`(nama ILIKE $${values.length} OR deskripsi ILIKE $${values.length})`);
  }
  if (tingkat) {
    values.push(tingkat);
    where.push(`tingkat = $${values.length}`);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', values };
}

async function findAll(filters, { limit, skip }) {
  const { clause, values } = buildWhere(filters);
  const [list, total] = await Promise.all([
    query(`SELECT * FROM programs ${clause} ORDER BY id ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, skip]),
    query(`SELECT COUNT(*) AS total FROM programs ${clause}`, values),
  ]);
  return { items: list.rows.map(toJSON), total: Number(total.rows[0].total) };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM programs WHERE id = $1', [id]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function findByName(nama) {
  const { rows } = await query('SELECT * FROM programs WHERE nama = $1 LIMIT 1', [nama]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function create(data) {
  const { text, values } = buildInsert('programs', data, FIELDS, TRANSFORM);
  const { rows } = await query(text, values);
  return toJSON(rows[0]);
}

async function update(id, data) {
  const { text, values } = buildUpdate('programs', id, data, FIELDS, TRANSFORM);
  const { rows } = await query(text, values);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function remove(id) {
  const { rows } = await query('DELETE FROM programs WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

async function count() {
  const { rows } = await query('SELECT COUNT(*) AS total FROM programs');
  return Number(rows[0].total);
}

module.exports = { findAll, findById, findByName, create, update, remove, count };
