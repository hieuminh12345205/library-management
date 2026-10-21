class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const badRequest = (fields, message = 'Dữ liệu gửi lên không hợp lệ') =>
  new ApiError(400, 'VALIDATION_ERROR', message, fields);
const unauthorized = (message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') =>
  new ApiError(401, 'UNAUTHORIZED', message);
const forbidden = (message = 'Bạn không có quyền thực hiện thao tác này.') =>
  new ApiError(403, 'FORBIDDEN', message);
const notFound = (message = 'Không tìm thấy tài nguyên.') => new ApiError(404, 'NOT_FOUND', message);
const conflict = (code, message) => new ApiError(409, code, message);

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, conflict };
