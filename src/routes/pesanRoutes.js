const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pesanController = require('../controllers/pesanController');
const { requireAuth } = require('../middlewares/auth');
const { validate, validId } = require('../middlewares/validate');

const router = express.Router();

const pesanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak pesan dari perangkat ini. Coba lagi nanti.' },
});

// Publik: POST /api/pesan
router.post(
  '/',
  pesanLimiter,
  body('nama').isString().trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 100 }),
  body('kontak').isString().trim().notEmpty().withMessage('Kontak wajib diisi').isLength({ max: 100 }),
  body('pesan').isString().trim().notEmpty().withMessage('Pesan wajib diisi').isLength({ max: 2000 }).withMessage('Pesan maksimal 2000 karakter'),
  validate,
  pesanController.kirimPesan,
);

// Admin
router.get('/', requireAuth, pesanController.getAllPesan);
router.put('/:id/dibaca', requireAuth, validId, pesanController.tandaiDibaca);
router.delete('/:id', requireAuth, validId, pesanController.hapusPesan);

module.exports = router;
