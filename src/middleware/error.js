const { ApiError } = require('../utils/errors');

function apiNotFound(req, res) {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy API.' });
}

// NFR-12: lỗi không lường trước → 500, không lộ stack trace
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { error: err.code, message: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dữ liệu JSON không hợp lệ.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
}

module.exports = { apiNotFound, errorHandler };
