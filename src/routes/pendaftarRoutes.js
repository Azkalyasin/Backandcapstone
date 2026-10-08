const express = require('express');
const router = express.Router();
const pendaftarController = require('../controllers/pendaftarController');

// TODO: Tambahkan middleware auth untuk route admin
// TODO: Tambahkan middleware validasi untuk form pendaftaran

// Public routes
// POST /api/pendaftar (submit pendaftaran online)
router.post('/', pendaftarController.submitPendaftaran);

// Admin only routes
// GET /api/pendaftar (get all pendaftar)
router.get('/', pendaftarController.getAllPendaftar);

// GET /api/pendaftar/:id
router.get('/:id', pendaftarController.getPendaftarById);

// PUT /api/pendaftar/:id/status
router.put('/:id/status', pendaftarController.updateStatusPendaftar);

// DELETE /api/pendaftar/:id
router.delete('/:id', pendaftarController.deletePendaftar);

module.exports = router;
