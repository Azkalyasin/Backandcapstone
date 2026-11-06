const Achievement = require('../models/Achievement');
const { ok, fail, getPagination, paginationMeta } = require('../utils/response');
const { resolveFoto, deleteByUrl } = require('../utils/storage');

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
  const { items, total } = await Achievement.findAll({ search: req.query.search, kategori: req.query.kategori }, { limit, skip });
  return ok(res, { achievements: items, pagination: paginationMeta(page, limit, total) });
};

// GET /api/achievements/:id
exports.getAchievementById = async (req, res) => {
  const achievement = await Achievement.findById(req.params.id);
  if (!achievement) return fail(res, 404, 'Achievement tidak ditemukan');
  return ok(res, achievement);
};

// POST /api/achievements (admin) — foto data URL di-upload ke Supabase Storage
exports.createAchievement = async (req, res) => {
  const data = pick(req.body);
  if (data.foto) data.foto = await resolveFoto(data.foto);
  const achievement = await Achievement.create(data);
  return ok(res, achievement, 'Achievement berhasil dibuat', 201);
};

// PUT /api/achievements/:id (admin)
exports.updateAchievement = async (req, res) => {
  const existing = await Achievement.findById(req.params.id);
  if (!existing) return fail(res, 404, 'Achievement tidak ditemukan');

  const data = pick(req.body);
  if (data.foto !== undefined && data.foto !== existing.foto) {
    data.foto = await resolveFoto(data.foto);
  }
  const achievement = await Achievement.update(req.params.id, data);
  // Foto diganti/dihapus -> bersihkan file lama di Storage.
  if (data.foto !== undefined && data.foto !== existing.foto) await deleteByUrl(existing.foto);
  return ok(res, achievement, 'Achievement berhasil diupdate');
};

// DELETE /api/achievements/:id (admin)
exports.deleteAchievement = async (req, res) => {
  const deleted = await Achievement.remove(req.params.id);
  if (!deleted) return fail(res, 404, 'Achievement tidak ditemukan');
  await deleteByUrl(deleted.foto);
  return ok(res, undefined, 'Achievement berhasil dihapus');
};
