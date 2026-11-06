// Uji integrasi API. Default memakai PostgreSQL in-memory (pg-mem): npm test
// Uji ke PostgreSQL/Supabase asli (database KOSONG khusus tes!): TEST_DATABASE_URL=postgres://... npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || '';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.TELEGRAM_BOT_TOKEN = '';
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'rahasia123';

const { connectDB, disconnectDB } = require('../src/config/db');
const { ensureSeed } = require('../src/seed/seed');
const app = require('../src/app');

let server;
let base;
let token;

async function api(method, path, body, auth = false) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  await connectDB();
  await ensureSeed();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await disconnectDB();
});

test('health check', async () => {
  const r = await api('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.database, 'connected');
});

test('login: salah password ditolak, benar dapat token', async () => {
  assert.equal((await api('POST', '/auth/login', { username: 'admin', password: 'salah' })).status, 401);
  assert.equal((await api('POST', '/auth/login', {})).status, 400);
  const r = await api('POST', '/auth/login', { username: 'admin', password: 'rahasia123' });
  assert.equal(r.status, 200);
  assert.ok(r.body.data.token);
  assert.equal(r.body.data.user.password, undefined);
  token = r.body.data.token;
  const profile = await api('GET', '/auth/profile', null, true);
  assert.equal(profile.body.data.username, 'admin');
});

test('program: publik bisa baca, admin bisa CRUD', async () => {
  const list = await api('GET', '/programs');
  assert.equal(list.body.data.programs.length, 4);
  assert.ok(list.body.data.programs[0].id);

  assert.equal((await api('POST', '/programs', { nama: 'X', tingkat: 'SD' })).status, 401);
  assert.equal((await api('POST', '/programs', { nama: '' }, true)).status, 400);

  const created = await api('POST', '/programs', { nama: 'Tes Program', tingkat: 'SMP', biaya: '450000', kuota: 8 }, true);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.biaya, 450000);
  const id = created.body.data.id;

  const updated = await api('PUT', `/programs/${id}`, { biaya: 475000 }, true);
  assert.equal(updated.body.data.biaya, 475000);
  assert.equal(updated.body.data.nama, 'Tes Program');

  const search = await api('GET', '/programs?search=tes');
  assert.equal(search.body.data.programs.length, 1);

  assert.equal((await api('DELETE', `/programs/${id}`, null, true)).status, 200);
  assert.equal((await api('GET', `/programs/${id}`)).status, 404);
  assert.equal((await api('GET', '/programs/bukan-id')).status, 404);
  assert.equal((await api('GET', '/programs/99999')).status, 404);
  assert.equal((await api('PUT', '/programs/99999', { nama: 'X' }, true)).status, 404);
});

test('achievement: validasi foto & CRUD', async () => {
  const bad = await api('POST', '/achievements', { namaSiswa: 'A', judul: 'B', foto: 'javascript:alert(1)' }, true);
  assert.equal(bad.status, 400);

  const created = await api(
    'POST',
    '/achievements',
    { namaSiswa: 'Rina', judul: 'Juara Lomba', kategori: 'Akademik', tanggal: '2026-03-01', foto: 'data:image/png;base64,iVBORw0KGgo=' },
    true,
  );
  assert.equal(created.status, 201);
  assert.equal(created.body.data.tahun, 2026);
  assert.equal(created.body.data.tanggal, '2026-03-01');
  // Storage belum dikonfigurasi -> foto tetap data URL
  assert.ok(created.body.data.foto.startsWith('data:image/png'));
  const filtered = await api('GET', '/achievements?kategori=Akademik');
  assert.equal(filtered.body.data.achievements.length, 3);
  assert.equal((await api('DELETE', `/achievements/${created.body.data.id}`, null, true)).status, 200);
});

test('pendaftar: publik daftar, admin kelola status', async () => {
  assert.equal((await api('POST', '/pendaftar', { nama: 'Tanpa HP' })).status, 400);

  const daftar = await api('POST', '/pendaftar', {
    nama: 'Dewi',
    telepon: '0812-3456-7890',
    jenisKelamin: 'Perempuan',
    jenjang: 'SMP',
    program: 'Intensif SMP',
    status: 'Selesai', // harus diabaikan
  });
  assert.equal(daftar.status, 201);
  assert.equal(daftar.body.data.status, 'Baru');

  assert.equal((await api('GET', '/pendaftar')).status, 401);
  const list = await api('GET', '/pendaftar', null, true);
  assert.equal(list.body.data.pendaftar.length, 1);
  assert.ok(list.body.data.pendaftar[0].programId);
  assert.equal(list.body.data.pendaftar[0].jenisKelamin, 'Perempuan');
  const search = await api('GET', '/pendaftar?search=dew', null, true);
  assert.equal(search.body.data.pendaftar.length, 1);

  const id = daftar.body.data.id;
  assert.equal((await api('PUT', `/pendaftar/${id}/status`, { status: 'Ngawur' }, true)).status, 400);
  const st = await api('PUT', `/pendaftar/${id}/status`, { status: 'Dihubungi' }, true);
  assert.equal(st.body.data.status, 'Dihubungi');

  const tanggal = await api('POST', '/pendaftar', { nama: 'Eko', telepon: '081299990000', tanggalLahir: '2011-01-31' });
  const detail = await api('GET', `/pendaftar/${tanggal.body.data.id}`, null, true);
  assert.equal(detail.body.data.tanggalLahir, '2011-01-31');
  await api('DELETE', `/pendaftar/${tanggal.body.data.id}`, null, true);

  const stats = await api('GET', '/stats', null, true);
  assert.equal(stats.body.data.pendaftar, 1);
  assert.equal(stats.body.data.pendaftarPerStatus.Dihubungi, 1);
});

test('pesan kontak tersimpan', async () => {
  const r = await api('POST', '/pesan', { nama: 'Andi', kontak: '0812', pesan: 'Halo' });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.telegram, false);
  const list = await api('GET', '/pesan', null, true);
  assert.equal(list.body.data.pesan.length, 1);
  const read = await api('PUT', `/pesan/${r.body.data.id}/dibaca`, {}, true);
  assert.equal(read.body.data.dibaca, true);
});

test('ganti password admin', async () => {
  assert.equal((await api('PUT', '/auth/password', { passwordLama: 'salah', passwordBaru: 'passwordbaru1' }, true)).status, 400);
  assert.equal((await api('PUT', '/auth/password', { passwordLama: 'rahasia123', passwordBaru: 'passwordbaru1' }, true)).status, 200);
  assert.equal((await api('POST', '/auth/login', { username: 'admin', password: 'rahasia123' })).status, 401);
  assert.equal((await api('POST', '/auth/login', { username: 'admin', password: 'passwordbaru1' })).status, 200);
});
