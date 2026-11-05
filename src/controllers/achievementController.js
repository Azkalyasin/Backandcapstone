const Achievement = require('../models/Achievement');
const { ok, fail, getPagination, paginationMeta, searchRegex } = require('../utils/response');

const FIELDS = ['namaSiswa', 'judul', 'deskripsi', 'kategori', 'tahun', 'tanggal', 'foto'];
function pick(body) {
  const data = Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
  // Isi tahun otomatis dari tanggal jika tidak dikirim.
  if (!data.tahun && data.tanggal) data.tahun = Number(String(data.tanggal).slice(0, 4)) || undefined;
  return data;
}

// GET /api/achievements?page&limit&search&kategori
exports.getAllAchievements = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search) {
    const rx = searchRegex(req.query.search);
    filter.$or = [{ namaSiswa: rx }, { judul: rx }];
  }
  if (req.query.kategori) filter.kategori = req.query.kategori;

  const [achievements, totalData] = await Promise.all([
    Achievement.find(filter).sort({ tanggal: -1, createdAt: -1 }).skip(skip).limit(limit),
    Achievement.countDocuments(filter),
  ]);
  return ok(res, { achievements, pagination: paginationMeta(page, limit, totalData) });
};

// GET /api/achievements/:id
exports.getAchievementById = async (req, res) => {
  const achievement = await Achievement.findById(req.params.id);
  if (!achievement) return fail(res, 404, 'Achievement tidak ditemukan');
  return ok(res, achievement);
};

// POST /api/achievements (admin)
exports.createAchievement = async (req, res) => {
  const achievement = await Achievement.create(pick(req.body));
  return ok(res, achievement, 'Achievement berhasil dibuat', 201);
};

// PUT /api/achievements/:id (admin)
exports.updateAchievement = async (req, res) => {
  const achievement = await Achievement.findByIdAndUpdate(req.params.id, pick(req.body), { returnDocument: 'after', runValidators: true });
  if (!achievement) return fail(res, 404, 'Achievement tidak ditemukan');
  return ok(res, achievement, 'Achievement berhasil diupdate');
};

// DELETE /api/achievements/:id (admin)
exports.deleteAchievement = async (req, res) => {
  const achievement = await Achievement.findByIdAndDelete(req.params.id);
  if (!achievement) return fail(res, 404, 'Achievement tidak ditemukan');
  return ok(res, undefined, 'Achievement berhasil dihapus');
};
