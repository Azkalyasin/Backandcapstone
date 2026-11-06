const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/** Kirim 400 jika ada aturan express-validator yang gagal. */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return fail(res, 400, errors[0].message, errors);
}

/** :id harus bilangan bulat positif (kolom SERIAL), selain itu langsung 404. */
function validId(req, res, next) {
  const id = Number(req.params.id);
  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    return fail(res, 404, 'Data tidak ditemukan');
  }
  req.params.id = id;
  next();
}

module.exports = { validate, validId };
