const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { ok, fail } = require('../utils/response');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.verifyLogin(username, password);
  if (!admin) return fail(res, 401, 'Username atau password salah');

  const token = jwt.sign({ sub: String(admin.id), username: admin.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return ok(res, { token, user: admin }, 'Login berhasil');
};

// POST /api/auth/logout
// JWT bersifat stateless: logout cukup dengan menghapus token di sisi frontend.
exports.logout = async (req, res) => ok(res, undefined, 'Logout berhasil');

// GET /api/auth/profile
exports.getProfile = async (req, res) => ok(res, req.admin);

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  const { passwordLama, passwordBaru } = req.body;
  const changed = await Admin.changePassword(req.admin.id, passwordLama, passwordBaru);
  if (!changed) return fail(res, 400, 'Password lama salah');
  return ok(res, undefined, 'Password berhasil diubah');
};
