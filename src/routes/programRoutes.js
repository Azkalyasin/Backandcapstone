const express = require('express');
const { body } = require('express-validator');
const programController = require('../controllers/programController');
const { requireAuth } = require('../middlewares/auth');
const { validate, validId } = require('../middlewares/validate');

const router = express.Router();

const rules = (isUpdate = false) => {
  const req = (chain) => (isUpdate ? chain.optional() : chain);
  return [
    req(body('nama')).isString().trim().notEmpty().withMessage('Nama program wajib diisi').isLength({ max: 120 }),
    req(body('tingkat')).isString().trim().notEmpty().withMessage('Tingkat/jenjang wajib diisi'),
    body('deskripsi').optional().isString().isLength({ max: 1000 }).withMessage('Deskripsi maksimal 1000 karakter'),
    body('durasi').optional().isString(),
    body('jadwal').optional().isString(),
    body('biaya').optional().isFloat({ min: 0 }).withMessage('Biaya harus angka positif').toFloat(),
    body('kuota').optional().isInt({ min: 0 }).withMessage('Kuota harus bilangan bulat positif').toInt(),
    body('tersedia').optional().isBoolean().toBoolean(),
    body('materi').optional().isArray(),
    body('fasilitas').optional().isArray(),
    validate,
  ];
};

// Publik
router.get('/', programController.getAllPrograms);
router.get('/:id', validId, programController.getProgramById);

// Admin
router.post('/', requireAuth, rules(), programController.createProgram);
router.put('/:id', requireAuth, validId, rules(true), programController.updateProgram);
router.delete('/:id', requireAuth, validId, programController.deleteProgram);

module.exports = router;
