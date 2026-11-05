const Program = require('../models/Program');
const Achievement = require('../models/Achievement');
const Pendaftar = require('../models/Pendaftar');
const Pesan = require('../models/Pesan');
const { ok } = require('../utils/response');

// GET /api/stats (admin) — ringkasan untuk dashboard
exports.getStats = async (req, res) => {
  const [programs, achievements, pendaftar, pendaftarBaru, pesanBelumDibaca, perStatus] = await Promise.all([
    Program.countDocuments(),
    Achievement.countDocuments(),
    Pendaftar.countDocuments(),
    Pendaftar.countDocuments({ status: 'Baru' }),
    Pesan.countDocuments({ dibaca: false }),
    Pendaftar.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
  ]);
  return ok(res, {
    programs,
    achievements,
    pendaftar,
    pendaftarBaru,
    pesanBelumDibaca,
    pendaftarPerStatus: Object.fromEntries(perStatus.map((s) => [s._id, s.total])),
  });
};
