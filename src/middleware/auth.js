const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { ApiError, unauthorized, forbidden } = require('../utils/errors');

// requireAuth() – chỉ cần đăng nhập; requireAuth('LIBRARIAN', 'ADMIN') – giới hạn vai trò
function requireAuth(...roles) {
  return async (req, res, next) => {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw unauthorized();
    }

    const revoked = await db.query('SELECT 1 FROM revoked_tokens WHERE jti = $1', [payload.jti]);
    if (revoked.rowCount > 0) throw unauthorized();

    const { rows } = await db.query(
      'SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = $1',
      [payload.sub],
    );
    const user = rows[0];
    if (!user) throw unauthorized();
    if (user.status === 'LOCKED') {
      throw new ApiError(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khoá. Vui lòng liên hệ thư viện.');
    }
    if (roles.length > 0 && !roles.includes(user.role)) throw forbidden();

    req.user = user;
    req.token = { jti: payload.jti, exp: payload.exp };
    next();
  };
}

module.exports = { requireAuth };
