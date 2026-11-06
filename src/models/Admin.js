const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { toIso } = require('./helpers');

// Bentuk data yang dikirim ke frontend (tanpa password).
function toJSON(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function count() {
  const { rows } = await query('SELECT COUNT(*) AS total FROM admins');
  return Number(rows[0].total);
}

async function create({ username, password, name = 'Administrator', email = '' }) {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    'INSERT INTO admins (username, password, name, email) VALUES ($1, $2, $3, $4) RETURNING *',
    [String(username).toLowerCase().trim(), hash, name, email],
  );
  return toJSON(rows[0]);
}

/** Cek username + password. Mengembalikan data admin, atau null jika salah. */
async function verifyLogin(username, password) {
  const { rows } = await query('SELECT * FROM admins WHERE username = $1', [String(username).toLowerCase().trim()]);
  if (!rows[0]) return null;
  const valid = await bcrypt.compare(String(password), rows[0].password);
  return valid ? toJSON(rows[0]) : null;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM admins WHERE id = $1', [id]);
  return rows[0] ? toJSON(rows[0]) : null;
}

async function changePassword(id, oldPassword, newPassword) {
  const { rows } = await query('SELECT password FROM admins WHERE id = $1', [id]);
  if (!rows[0] || !(await bcrypt.compare(String(oldPassword), rows[0].password))) return false;
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE admins SET password = $1, updated_at = now() WHERE id = $2', [hash, id]);
  return true;
}

module.exports = { count, create, verifyLogin, findById, changePassword };
