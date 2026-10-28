const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { publicUser } = require('./auth');
const v = require('../utils/validate');

const router = express.Router();
router.use(requireAuth('ADMIN'));

const STATUSES = ['ACTIVE', 'LOCKED'];

// FR-11 – danh sách
router.get('/users', async (req, res) => {
  const { page, size, offset } = v.parsePaging(req.query);
  const count = await db.query('SELECT count(*)::int AS n FROM users');
  const { rows } = await db.query('SELECT * FROM users ORDER BY id ASC LIMIT $1 OFFSET $2', [size, offset]);
  res.json({ data: rows.map(publicUser), pagination: v.pagination(page, size, count.rows[0].n) });
});

// FR-11 – khoá / mở khoá
router.patch('/users/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) throw badRequest({ status: 'Trạng thái là ACTIVE hoặc LOCKED' });
  const id = v.parseId(req.params.id);
  const { rows } = await db.query('SELECT id FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw notFound('Không tìm thấy tài khoản.');
  if (id === req.user.id) throw conflict('SELF_MODIFICATION', 'Bạn không thể khoá tài khoản của chính mình.');
  const upd = await db.query('UPDATE users SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
  res.json({ data: publicUser(upd.rows[0]) });
});

module.exports = { router };
