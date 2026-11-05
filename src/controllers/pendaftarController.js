const Pendaftar = require('../models/Pendaftar');
const Program = require('../models/Program');
const { ok, fail, getPagination, paginationMeta, searchRegex } = require('../utils/response');
const { notifyPendaftar } = require('../utils/telegram');

const PUBLIC_FIELDS = ['nama', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'alamat', 'telepon', 'email', 'namaOrangTua', 'jenjang', 'program', 'pesan'];

// POST /api/pendaftar (publik — form pendaftaran online)
exports.submitPendaftaran = async (req, res) => {
  const data = Object.fromEntries(PUBLIC_FIELDS.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));

  // Hubungkan ke program jika ditemukan berdasarkan id atau nama.
  const program = req.body.programId
    ? await Program.findById(req.body.programId).catch(() => null)
    : data.program ? await Program.findOne({ nama: data.program }) : null;
  if (program) {
    data.programId = program._id;
    data.program = program.nama;
    data.jenjang = data.jenjang || program.tingkat;
  }

  const pendaftar = await Pendaftar.create(data); // status selalu 'Baru'
  notifyPendaftar(pendaftar); // tidak ditunggu, agar respons tetap cepat

  return ok(res, { id: pendaftar.id, nama: pendaftar.nama, program: pendaftar.program, status: pendaftar.status }, 'Pendaftaran berhasil dikirim', 201);
};

// GET /api/pendaftar?page&limit&search&status (admin)
exports.getAllPendaftar = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = searchRegex(req.query.search);
    filter.$or = [{ nama: rx }, { email: rx }, { telepon: rx }, { program: rx }, { jenjang: rx }];
  }

  const [pendaftar, totalData] = await Promise.all([
    Pendaftar.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Pendaftar.countDocuments(filter),
  ]);
  return ok(res, { pendaftar, pagination: paginationMeta(page, limit, totalData) });
};

// GET /api/pendaftar/:id (admin)
exports.getPendaftarById = async (req, res) => {
  const pendaftar = await Pendaftar.findById(req.params.id);
  if (!pendaftar) return fail(res, 404, 'Pendaftar tidak ditemukan');
  return ok(res, pendaftar);
};

// PUT /api/pendaftar/:id/status (admin)
exports.updateStatusPendaftar = async (req, res) => {
  const pendaftar = await Pendaftar.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after', runValidators: true });
  if (!pendaftar) return fail(res, 404, 'Pendaftar tidak ditemukan');
  return ok(res, pendaftar, 'Status pendaftar berhasil diupdate');
};

// DELETE /api/pendaftar/:id (admin)
exports.deletePendaftar = async (req, res) => {
  const pendaftar = await Pendaftar.findByIdAndDelete(req.params.id);
  if (!pendaftar) return fail(res, 404, 'Pendaftar tidak ditemukan');
  return ok(res, undefined, 'Pendaftar berhasil dihapus');
};
