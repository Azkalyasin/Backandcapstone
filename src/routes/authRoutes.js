const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

// Batasi percobaan login: 10x per 15 menit per IP (mencegah tebak password).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  body('username').isString().trim().notEmpty().withMessage('Username wajib diisi'),
  body('password').isString().notEmpty().withMessage('Password wajib diisi'),
  validate,
  authController.login,
);

// POST /api/auth/logout
router.post('/logout', requireAuth, authController.logout);

// GET /api/auth/profile
router.get('/profile', requireAuth, authController.getProfile);

// PUT /api/auth/password
router.put(
  '/password',
  requireAuth,
  body('passwordLama').isString().notEmpty().withMessage('Password lama wajib diisi'),
  body('passwordBaru').isString().isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter'),
  validate,
  authController.changePassword,
);

module.exports = router;
