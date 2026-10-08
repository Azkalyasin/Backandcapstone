const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');

// TODO: Tambahkan middleware auth untuk route admin (create, update, delete)
// TODO: Tambahkan middleware multer untuk upload foto achievement

// Public routes
// GET /api/achievements
router.get('/', achievementController.getAllAchievements);

// GET /api/achievements/:id
router.get('/:id', achievementController.getAchievementById);

// Admin only routes
// POST /api/achievements (dengan upload foto)
router.post('/', achievementController.createAchievement);

// PUT /api/achievements/:id
router.put('/:id', achievementController.updateAchievement);

// DELETE /api/achievements/:id
router.delete('/:id', achievementController.deleteAchievement);

module.exports = router;
