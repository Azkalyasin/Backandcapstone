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
  const { items, total } = await Pesan.findAll({ limit, skip });
  return ok(res, { pesan: items, pagination: paginationMeta(page, limit, total) });
};

// PUT /api/pesan/:id/dibaca (admin)
exports.tandaiDibaca = async (req, res) => {
  const pesan = await Pesan.setDibaca(req.params.id, req.body.dibaca !== false);
  if (!pesan) return fail(res, 404, 'Pesan tidak ditemukan');
  return ok(res, pesan);
};

// DELETE /api/pesan/:id (admin)
exports.hapusPesan = async (req, res) => {
  const deleted = await Pesan.remove(req.params.id);
  if (!deleted) return fail(res, 404, 'Pesan tidak ditemukan');
  return ok(res, undefined, 'Pesan berhasil dihapus');
};
