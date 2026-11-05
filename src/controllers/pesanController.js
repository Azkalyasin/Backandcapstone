const Pesan = require('../models/Pesan');
const { ok, fail, getPagination, paginationMeta } = require('../utils/response');
const { notifyPesan, isTelegramConfigured } = require('../utils/telegram');

// POST /api/pesan (publik — form "Kirim pesan")
exports.kirimPesan = async (req, res) => {
  // Honeypot: bot spam biasanya mengisi field tersembunyi "website".
  if (req.body.website) return ok(res, { telegram: false }, 'Pesan terkirim', 201);

  const { nama, kontak, pesan } = req.body;
  const saved = await Pesan.create({ nama, kontak, pesan });
  const telegram = isTelegramConfigured() ? await notifyPesan(saved) : false;
  return ok(res, { id: saved.id, telegram }, 'Pesan berhasil dikirim', 201);
};

// GET /api/pesan (admin)
exports.getAllPesan = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 100);
  const [pesan, totalData] = await Promise.all([
    Pesan.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Pesan.countDocuments(),
  ]);
  return ok(res, { pesan, pagination: paginationMeta(page, limit, totalData) });
};

// PUT /api/pesan/:id/dibaca (admin)
exports.tandaiDibaca = async (req, res) => {
  const pesan = await Pesan.findByIdAndUpdate(req.params.id, { dibaca: req.body.dibaca !== false }, { returnDocument: 'after' });
  if (!pesan) return fail(res, 404, 'Pesan tidak ditemukan');
  return ok(res, pesan);
};

// DELETE /api/pesan/:id (admin)
exports.hapusPesan = async (req, res) => {
  const pesan = await Pesan.findByIdAndDelete(req.params.id);
  if (!pesan) return fail(res, 404, 'Pesan tidak ditemukan');
  return ok(res, undefined, 'Pesan berhasil dihapus');
};
