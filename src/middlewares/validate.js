const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/** Kirim 400 jika ada aturan express-validator yang gagal. */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return fail(res, 400, errors[0].message, errors);
}

/** Tolak :id yang bukan ObjectId MongoDB agar tidak memicu error 500. */
function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'Data tidak ditemukan');
  next();
}

module.exports = { validate, validId };
