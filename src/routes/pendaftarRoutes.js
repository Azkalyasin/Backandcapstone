const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pendaftarController = require('../controllers/pendaftarController');
const { STATUS } = require('../models/Pendaftar');
const { requireAuth } = require('../middlewares/auth');
const { validate, validId } = require('../middlewares/validate');

const router = express.Router();

// Cegah spam pendaftaran: 20 kiriman per jam per IP.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak pendaftaran dari perangkat ini. Coba lagi nanti.' },
});

// Publik: POST /api/pendaftar
router.post(
  '/',
  submitLimiter,
  body('nama').isString().trim().notEmpty().withMessage('Nama lengkap wajib diisi').isLength({ max: 120 }),
  body('telepon')
    .isString().trim().notEmpty().withMessage('Nomor HP/WhatsApp wajib diisi')
    .matches(/^\+?[0-9\s-]{9,20}$/).withMessage('Nomor HP/WhatsApp tidak valid'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email tidak valid'),
  body('tempatLahir').optional().isString().isLength({ max: 80 }),
  body('tanggalLahir').optional({ values: 'falsy' }).isISO8601().withMessage('Tanggal lahir tidak valid'),
  body('jenisKelamin').optional({ values: 'falsy' }).isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin tidak valid'),
  body('alamat').optional().isString().isLength({ max: 500 }),
  body('namaOrangTua').optional().isString().isLength({ max: 120 }),
  body('jenjang').optional().isString(),
  body('program').optional().isString(),
  body('pesan').optional().isString().isLength({ max: 1000 }),
  validate,
  pendaftarController.submitPendaftaran,
);

// Admin
router.get('/', requireAuth, pendaftarController.getAllPendaftar);
router.get('/:id', requireAuth, validId, pendaftarController.getPendaftarById);
router.put(
  '/:id/status',
  requireAuth,
  validId,
  body('status').isIn(STATUS).withMessage(`Status harus salah satu dari: ${STATUS.join(', ')}`),
  validate,
  pendaftarController.updateStatusPendaftar,
);
router.delete('/:id', requireAuth, validId, pendaftarController.deletePendaftar);

module.exports = router;
