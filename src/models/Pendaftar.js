const { query } = require('../config/db');
const { toDateStr, toIso, likePattern, buildInsert, buildUpdate } = require('./helpers');

const STATUS = ['Baru', 'Dihubungi', 'Selesai'];

const FIELDS = {
  nama: 'nama',
  tempatLahir: 'tempat_lahir',
  tanggalLahir: 'tanggal_lahir',
  jenisKelamin: 'jenis_kelamin',
  alamat: 'alamat',
  telepon: 'telepon',
  email: 'email',
  namaOrangTua: 'nama_orang_tua',
  jenjang: 'jenjang',
  program: 'program',
  programId: 'program_id',
  pesan: 'pesan',
  status: 'status',
};
const TRANSFORM = { tanggalLahir: (v) => v || null };

function toJSON(row) {
  return {
    id: row.id,
    nama: row.nama,
    tempatLahir: row.tempat_lahir,
    tanggalLahir: toDateStr(row.tanggal_lahir),
    jenisKelamin: row.jenis_kelamin,
    alamat: row.alamat,
    telepon: row.telepon,
    email: row.email,
    namaOrangTua: row.nama_orang_tua,
    jenjang: row.jenjang,
    program: row.program,
    programId: row.program_id,
    pesan: row.pesan,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function buildWhere({ search, status }) {
  const where = [];
  const values = [];
  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }
  if (search) {
    values.push(likePattern(search));
    const p = `$${values.length}`;
    where.push(`(nama ILIKE ${p} OR email ILIKE ${p} OR telepon ILIKE ${p} OR program ILIKE ${p} OR jenjang ILIKE ${p})`);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', values };
}

async function findAll(filters, { limit, skip }) {
  const { clause, values } = buildWhere(filters);
  const [list, total] = await Promise.all([
    query(`SELECT * FROM pendaftar ${clause} ORDER BY created_at DESC, id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, skip]),
    query(`SELECT COUNT(*) AS total FROM pendaftar ${clause}`, values),
  ]);
  return { items: list.rows.map(toJSON), total: Number(total.rows[0].total) };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM pendaftar WHERE id = $1', [id]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function create(data) {
  const { text, values } = buildInsert('pendaftar', data, FIELDS, TRANSFORM);
  const { rows } = await query(text, values);
  return toJSON(rows[0]);
}

async function updateStatus(id, status) {
  const { text, values } = buildUpdate('pendaftar', id, { status }, FIELDS);
  const { rows } = await query(text, values);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function remove(id) {
  const { rows } = await query('DELETE FROM pendaftar WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

async function stats() {
  const [total, perStatus] = await Promise.all([
    query('SELECT COUNT(*) AS total FROM pendaftar'),
    query('SELECT status, COUNT(*) AS total FROM pendaftar GROUP BY status'),
  ]);
  const byStatus = Object.fromEntries(perStatus.rows.map((r) => [r.status, Number(r.total)]));
  return { total: Number(total.rows[0].total), byStatus };
}

module.exports = { STATUS, findAll, findById, create, updateStatus, remove, stats };
