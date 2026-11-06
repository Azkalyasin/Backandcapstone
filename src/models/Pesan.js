const { query } = require('../config/db');
const { toIso } = require('./helpers');

// Pesan dari form "Kirim pesan" di halaman Profil/Kontak.
function toJSON(row) {
  return {
    id: row.id,
    nama: row.nama,
    kontak: row.kontak,
    pesan: row.pesan,
    dibaca: row.dibaca,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function create({ nama, kontak, pesan }) {
  const { rows } = await query('INSERT INTO pesan (nama, kontak, pesan) VALUES ($1, $2, $3) RETURNING *', [nama, kontak, pesan]);
  return toJSON(rows[0]);
}

async function findAll({ limit, skip }) {
  const [list, total] = await Promise.all([
    query('SELECT * FROM pesan ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2', [limit, skip]),
    query('SELECT COUNT(*) AS total FROM pesan'),
  ]);
  return { items: list.rows.map(toJSON), total: Number(total.rows[0].total) };
}

async function setDibaca(id, dibaca) {
  const { rows } = await query('UPDATE pesan SET dibaca = $1, updated_at = now() WHERE id = $2 RETURNING *', [dibaca, id]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function remove(id) {
  const { rows } = await query('DELETE FROM pesan WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

async function countUnread() {
  const { rows } = await query('SELECT COUNT(*) AS total FROM pesan WHERE dibaca = FALSE');
  return Number(rows[0].total);
}

module.exports = { create, findAll, setDibaca, remove, countUnread };
