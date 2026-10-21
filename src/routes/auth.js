const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ApiError, badRequest, conflict } = require('../utils/errors');
const { toIsoVN } = require('../utils/dates');
const v = require('../utils/validate');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    createdAt: toIsoVN(u.created_at),
  };
}

// FR-01
router.post('/register', async (req, res) => {
  const b = req.body || {};
  const fields = {};
  if (!v.isValidName(b.fullName)) fields.fullName = v.MSG.fullName;
  if (!v.isValidEmail(b.email)) fields.email = v.MSG.email;
  if (!v.isStr(b.phone) || !v.PHONE_RE.test(b.phone.trim())) fields.phone = v.MSG.phone;
  if (!v.isValidPassword(b.password)) fields.password = v.MSG.password;
  if (b.confirmPassword !== b.password) fields.confirmPassword = v.MSG.confirmPassword;
  if (Object.keys(fields).length) throw badRequest(fields);

  const email = b.email.trim().toLowerCase();
  const exists = await db.query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
  if (exists.rowCount) throw conflict('EMAIL_EXISTS', 'Email đã được sử dụng.');

  const hash = await bcrypt.hash(b.password, config.bcryptCost);
  try {
    const { rows } = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [b.fullName.trim().replace(/\s+/g, ' '), email, b.phone.trim(), hash],
    );
    res.status(201).json({ data: publicUser(rows[0]) });
  } catch (err) {
    if (err.code === '23505') throw conflict('EMAIL_EXISTS', 'Email đã được sử dụng.');
    throw err;
  }
});

// FR-02
router.post('/login', async (req, res) => {
  const b = req.body || {};
  const fields = {};
  if (!b.email?.trim()) fields.email = 'Vui lòng nhập email';
  if (!v.isStr(b.password) || !b.password) fields.password = 'Vui lòng nhập mật khẩu';
  if (Object.keys(fields).length) throw badRequest(fields);

  const { rows } = await db.query('SELECT * FROM users WHERE lower(email) = $1', [b.email.trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(b.password, user.password_hash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
  }
  if (user.status === 'LOCKED') {
    throw new ApiError(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khoá. Vui lòng liên hệ thư viện.');
  }

  const token = jwt.sign({ sub: user.id, role: user.role, jti: crypto.randomUUID() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  res.json({ data: { token, tokenType: 'Bearer', expiresIn: config.jwtExpiresIn, user: publicUser(user) } });
});

router.post('/logout', requireAuth(), async (req, res) => {
  await db.query(
    'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT DO NOTHING',
    [req.token.jti, req.token.exp],
  );
  res.json({ data: { message: 'Đăng xuất thành công.' } });
});

router.get('/me', requireAuth(), (req, res) => {
  res.json({ data: publicUser(req.user) });
});

module.exports = { router, publicUser };
