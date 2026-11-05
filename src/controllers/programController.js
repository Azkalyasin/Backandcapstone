const Program = require('../models/Program');
const { ok, fail, getPagination, paginationMeta, searchRegex } = require('../utils/response');

const FIELDS = ['nama', 'deskripsi', 'tingkat', 'durasi', 'jadwal', 'biaya', 'kuota', 'tersedia', 'materi', 'fasilitas'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// GET /api/programs?page&limit&search&tingkat
exports.getAllPrograms = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search) {
    const rx = searchRegex(req.query.search);
    filter.$or = [{ nama: rx }, { deskripsi: rx }];
  }
  if (req.query.tingkat) filter.tingkat = req.query.tingkat;

  const [programs, totalData] = await Promise.all([
    Program.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Program.countDocuments(filter),
  ]);
  return ok(res, { programs, pagination: paginationMeta(page, limit, totalData) });
};

// GET /api/programs/:id
exports.getProgramById = async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) return fail(res, 404, 'Program tidak ditemukan');
  return ok(res, program);
};

// POST /api/programs (admin)
exports.createProgram = async (req, res) => {
  const program = await Program.create(pick(req.body));
  return ok(res, program, 'Program berhasil dibuat', 201);
};

// PUT /api/programs/:id (admin)
exports.updateProgram = async (req, res) => {
  const program = await Program.findByIdAndUpdate(req.params.id, pick(req.body), { returnDocument: 'after', runValidators: true });
  if (!program) return fail(res, 404, 'Program tidak ditemukan');
  return ok(res, program, 'Program berhasil diupdate');
};

// DELETE /api/programs/:id (admin)
exports.deleteProgram = async (req, res) => {
  const program = await Program.findByIdAndDelete(req.params.id);
  if (!program) return fail(res, 404, 'Program tidak ditemukan');
  return ok(res, undefined, 'Program berhasil dihapus');
};
