const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// TODO: Tambahkan middleware auth untuk route yang memerlukan autentikasi

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/profile
router.get('/profile', authController.getProfile);

module.exports = router;
