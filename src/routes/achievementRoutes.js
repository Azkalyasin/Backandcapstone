const express = require('express');
const { body } = require('express-validator');
const achievementController = require('../controllers/achievementController');
const { requireAuth } = require('../middlewares/auth');
const { validate, validId } = require('../middlewares/validate');

const router = express.Router();

// Foto: data URL gambar (maks ~1 MB) atau URL http(s).
const MAX_FOTO_LENGTH = 1.4 * 1024 * 1024; // ~1 MB file setelah base64

const rules = (isUpdate = false) => {
  const req = (chain) => (isUpdate ? chain.optional() : chain);
  return [
    req(body('namaSiswa')).isString().trim().notEmpty().withMessage('Nama siswa wajib diisi').isLength({ max: 120 }),
    req(body('judul')).isString().trim().notEmpty().withMessage('Judul prestasi wajib diisi').isLength({ max: 200 }),
    body('deskripsi').optional().isString().isLength({ max: 1500 }).withMessage('Deskripsi maksimal 1500 karakter'),
    body('kategori').optional().isString().trim(),
    body('tahun').optional({ values: 'falsy' }).isInt({ min: 1990, max: 2100 }).withMessage('Tahun tidak valid').toInt(),
    body('tanggal').optional({ values: 'falsy' }).isISO8601().withMessage('Tanggal tidak valid (YYYY-MM-DD)'),
    body('foto')
      .optional({ values: 'falsy' })
      .isString()
      .custom((v) => /^data:image\/(png|jpe?g|webp|gif);base64,/.test(v) || /^https?:\/\//.test(v))
      .withMessage('Format foto tidak didukung')
      .isLength({ max: MAX_FOTO_LENGTH })
      .withMessage('Ukuran foto maksimal 1 MB'),
    validate,
  ];
};

// Publik
router.get('/', achievementController.getAllAchievements);
router.get('/:id', validId, achievementController.getAchievementById);

// Admin
router.post('/', requireAuth, rules(), achievementController.createAchievement);
router.put('/:id', requireAuth, validId, rules(true), achievementController.updateAchievement);
router.delete('/:id', requireAuth, validId, achievementController.deleteAchievement);

module.exports = router;
