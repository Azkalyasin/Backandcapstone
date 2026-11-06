const Program = require('../models/Program');
const Achievement = require('../models/Achievement');
const Pendaftar = require('../models/Pendaftar');
const Pesan = require('../models/Pesan');
const { ok } = require('../utils/response');

// GET /api/stats (admin) — ringkasan untuk dashboard
exports.getStats = async (req, res) => {
  const [programs, achievements, pendaftar, pesanBelumDibaca] = await Promise.all([
    Program.count(),
    Achievement.count(),
    Pendaftar.stats(),
    Pesan.countUnread(),
  ]);
  return ok(res, {
    programs,
    achievements,
    pendaftar: pendaftar.total,
    pendaftarBaru: pendaftar.byStatus.Baru || 0,
    pesanBelumDibaca,
    pendaftarPerStatus: pendaftar.byStatus,
  });
};
