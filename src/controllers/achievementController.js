// TODO: Implementasi controller untuk achievement

// Get semua achievement (public)
exports.getAllAchievements = async (req, res) => {
  // TODO: Implementasi get all achievements
  res.status(501).json({ message: 'Get all achievements belum diimplementasikan' });
};

// Get detail achievement (public)
exports.getAchievementById = async (req, res) => {
  // TODO: Implementasi get achievement by id
  res.status(501).json({ message: 'Get achievement by id belum diimplementasikan' });
};

// Create achievement dengan upload foto (admin only)
exports.createAchievement = async (req, res) => {
  // TODO: Implementasi create achievement dengan multer untuk upload foto
  res.status(501).json({ message: 'Create achievement belum diimplementasikan' });
};

// Update achievement (admin only)
exports.updateAchievement = async (req, res) => {
  // TODO: Implementasi update achievement
  res.status(501).json({ message: 'Update achievement belum diimplementasikan' });
};

// Delete achievement (admin only)
exports.deleteAchievement = async (req, res) => {
  // TODO: Implementasi delete achievement
  res.status(501).json({ message: 'Delete achievement belum diimplementasikan' });
};
