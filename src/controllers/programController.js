const Program = require('../models/Program');
const { ok, fail, getPagination, paginationMeta } = require('../utils/response');

const FIELDS = ['nama', 'deskripsi', 'tingkat', 'durasi', 'jadwal', 'biaya', 'kuota', 'tersedia', 'materi', 'fasilitas'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// GET /api/programs?page&limit&search&tingkat
exports.getAllPrograms = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { items, total } = await Program.findAll({ search: req.query.search, tingkat: req.query.tingkat }, { limit, skip });
  return ok(res, { programs: items, pagination: paginationMeta(page, limit, total) });
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
  const program = await Program.update(req.params.id, pick(req.body));
  if (!program) return fail(res, 404, 'Program tidak ditemukan');
  return ok(res, program, 'Program berhasil diupdate');
};

// DELETE /api/programs/:id (admin)
exports.deleteProgram = async (req, res) => {
  const deleted = await Program.remove(req.params.id);
  if (!deleted) return fail(res, 404, 'Program tidak ditemukan');
  return ok(res, undefined, 'Program berhasil dihapus');
};
