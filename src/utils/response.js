// Format respons seragam sesuai docs/API_ENDPOINTS.md

function ok(res, data, message, status = 200) {
  const body = { status: 'success' };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
}

function fail(res, status, message, errors) {
  const body = { status: 'error', message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

/** Baca ?page & ?limit dengan batas aman. */
function getPagination(query, defaultLimit = 50) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(page, limit, totalData) {
  return { page, limit, totalData, totalPages: Math.max(1, Math.ceil(totalData / limit)) };
}

module.exports = { ok, fail, getPagination, paginationMeta };
