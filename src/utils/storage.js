// Upload foto achievement ke Supabase Storage (REST API, tanpa library tambahan).
// Butuh env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, (opsional) SUPABASE_BUCKET.
// Jika belum dikonfigurasi, foto tetap disimpan sebagai data URL di database.

const crypto = require('crypto');

const BUCKET = () => process.env.SUPABASE_BUCKET || 'achievements';
const BASE = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

function isStorageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function headers(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

function publicPrefix() {
  return `${BASE()}/storage/v1/object/public/${BUCKET()}/`;
}

/** Buat bucket publik jika belum ada (dipanggil sekali saat server start). */
async function ensureBucket() {
  if (!isStorageConfigured()) return;
  const res = await fetch(`${BASE()}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: BUCKET(), name: BUCKET(), public: true, file_size_limit: 2 * 1024 * 1024 }),
  });
  if (res.ok) {
    console.log(`Supabase Storage: bucket "${BUCKET()}" dibuat.`);
    return;
  }
  const body = await res.json().catch(() => ({}));
  const text = JSON.stringify(body);
  if (!/already exists|Duplicate/i.test(text)) {
    console.warn('Supabase Storage: bucket gagal disiapkan —', body.message || res.status);
  }
}

/** Upload data URL gambar, kembalikan URL publiknya. */
async function uploadDataUrl(dataUrl) {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error('Format foto tidak valid');
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  const filePath = `${new Date().getFullYear()}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${EXT[mime] || 'jpg'}`;

  const res = await fetch(`${BASE()}/storage/v1/object/${BUCKET()}/${filePath}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': mime, 'x-upsert': 'false', 'cache-control': '31536000' }),
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Upload foto ke Supabase gagal: ${body.message || res.status}`);
  }
  return `${publicPrefix()}${filePath}`;
}

/** Hapus file di Storage jika URL berasal dari bucket ini (data URL / URL luar diabaikan). */
async function deleteByUrl(url) {
  if (!isStorageConfigured() || !url || !url.startsWith(publicPrefix())) return;
  const filePath = url.slice(publicPrefix().length);
  try {
    await fetch(`${BASE()}/storage/v1/object/${BUCKET()}`, {
      method: 'DELETE',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: [filePath] }),
    });
  } catch (error) {
    console.warn('Gagal menghapus foto lama di Storage:', error.message);
  }
}

/**
 * Jika `foto` berupa data URL dan Storage aktif -> upload & ganti dengan URL publik.
 * Selain itu kembalikan apa adanya.
 */
async function resolveFoto(foto) {
  if (!foto || !foto.startsWith('data:') || !isStorageConfigured()) return foto;
  return uploadDataUrl(foto);
}

module.exports = { isStorageConfigured, ensureBucket, uploadDataUrl, deleteByUrl, resolveFoto };
