const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// TODO: Tambahkan middleware auth untuk route admin (create, update, delete)

// Public routes
// GET /api/programs
router.get('/', programController.getAllPrograms);

// GET /api/programs/:id
router.get('/:id', programController.getProgramById);

// Admin only routes
// POST /api/programs
router.post('/', programController.createProgram);

// PUT /api/programs/:id
router.put('/:id', programController.updateProgram);

// DELETE /api/programs/:id
router.delete('/:id', programController.deleteProgram);

module.exports = router;
