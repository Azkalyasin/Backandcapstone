const Pendaftar = require('../models/Pendaftar');
const Program = require('../models/Program');
const { ok, fail, getPagination, paginationMeta } = require('../utils/response');
const { notifyPendaftar } = require('../utils/telegram');

const PUBLIC_FIELDS = ['nama', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'alamat', 'telepon', 'email', 'namaOrangTua', 'jenjang', 'program', 'pesan'];

// POST /api/pendaftar (publik — form pendaftaran online)
exports.submitPendaftaran = async (req, res) => {
  const data = Object.fromEntries(PUBLIC_FIELDS.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));

  // Hubungkan ke program jika ditemukan berdasarkan id atau nama.
  const programId = Number(req.body.programId);
  const program = Number.isInteger(programId) && programId > 0
    ? await Program.findById(programId)
    : data.program ? await Program.findByName(data.program) : null;
  if (program) {
    data.programId = program.id;
    data.program = program.nama;
    data.jenjang = data.jenjang || program.tingkat;
  }

  const pendaftar = await Pendaftar.create(data); // status selalu 'Baru' (default tabel)
  notifyPendaftar(pendaftar); // tidak ditunggu, agar respons tetap cepat

  return ok(res, { id: pendaftar.id, nama: pendaftar.nama, program: pendaftar.program, status: pendaftar.status }, 'Pendaftaran berhasil dikirim', 201);
};

// GET /api/pendaftar?page&limit&search&status (admin)
exports.getAllPendaftar = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 100);
  const { items, total } = await Pendaftar.findAll({ search: req.query.search, status: req.query.status }, { limit, skip });
  return ok(res, { pendaftar: items, pagination: paginationMeta(page, limit, total) });
};

// GET /api/pendaftar/:id (admin)
exports.getPendaftarById = async (req, res) => {
  const pendaftar = await Pendaftar.findById(req.params.id);
  if (!pendaftar) return fail(res, 404, 'Pendaftar tidak ditemukan');
  return ok(res, pendaftar);
};

// PUT /api/pendaftar/:id/status (admin)
exports.updateStatusPendaftar = async (req, res) => {
  const pendaftar = await Pendaftar.updateStatus(req.params.id, req.body.status);
  if (!pendaftar) return fail(res, 404, 'Pendaftar tidak ditemukan');
  return ok(res, pendaftar, 'Status pendaftar berhasil diupdate');
};

// DELETE /api/pendaftar/:id (admin)
exports.deletePendaftar = async (req, res) => {
  const deleted = await Pendaftar.remove(req.params.id);
  if (!deleted) return fail(res, 404, 'Pendaftar tidak ditemukan');
  return ok(res, undefined, 'Pendaftar berhasil dihapus');
};
