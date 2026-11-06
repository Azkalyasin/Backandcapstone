// Utilitas bersama untuk lapisan data PostgreSQL.

/** DATE dari Postgres -> 'YYYY-MM-DD' (string dari pg, atau Date dari pg-mem). */
function toDateStr(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** TIMESTAMPTZ -> ISO string. */
function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** JSONB array (kadang berupa string di pg-mem) -> array. */
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Pola ILIKE yang aman: escape % dan _ dari input pengguna. */
function likePattern(text) {
  return `%${String(text).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * Bangun UPDATE dinamis hanya untuk kolom yang dikirim.
 * `fieldMap` = { namaFieldApi: 'nama_kolom' }.
 */
function buildUpdate(table, id, data, fieldMap, transform = {}) {
  const sets = [];
  const values = [];
  for (const [field, column] of Object.entries(fieldMap)) {
    if (data[field] === undefined) continue;
    values.push(transform[field] ? transform[field](data[field]) : data[field]);
    sets.push(`${column} = $${values.length}`);
  }
  sets.push('updated_at = now()');
  values.push(id);
  return { text: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values };
}

/** Bangun INSERT dari field yang dikirim saja (sisanya pakai DEFAULT tabel). */
function buildInsert(table, data, fieldMap, transform = {}) {
  const columns = [];
  const values = [];
  for (const [field, column] of Object.entries(fieldMap)) {
    if (data[field] === undefined) continue;
    columns.push(column);
    values.push(transform[field] ? transform[field](data[field]) : data[field]);
  }
  const placeholders = values.map((_, i) => `$${i + 1}`);
  return { text: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values };
}

module.exports = { toDateStr, toIso, toArray, likePattern, buildUpdate, buildInsert };
