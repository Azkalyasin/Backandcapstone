const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { fail } = require('../utils/response');

/** Wajib login admin: header `Authorization: Bearer <token>`. */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return fail(res, 401, 'Silakan login terlebih dahulu');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return fail(res, 401, 'Sesi tidak valid atau sudah kedaluwarsa, silakan login ulang');
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin) return fail(res, 401, 'Akun admin tidak ditemukan');

  req.admin = admin;
  next();
}

module.exports = { requireAuth };
