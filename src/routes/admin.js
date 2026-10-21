const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { publicUser } = require('./auth');
const v = require('../utils/validate');

const router = express.Router();
router.use(requireAuth('ADMIN'));

const ROLES = ['READER', 'LIBRARIAN', 'ADMIN'];
const STATUSES = ['ACTIVE', 'LOCKED'];

// FR-11 – danh sách
router.get('/users', async (req, res) => {
  const { q = '', role, status } = req.query;
  const fields = {};
  if (!v.isStr(q) || q.length > 100) fields.q = v.MSG.q;
  if (role !== undefined && role !== '' && !ROLES.includes(role)) fields.role = 'Vai trò không hợp lệ';
  if (status !== undefined && status !== '' && !STATUSES.includes(status)) fields.status = 'Trạng thái không hợp lệ';
  if (Object.keys(fields).length) throw badRequest(fields);
  const { page, size, offset } = v.parsePaging(req.query);

  const where = [];
  const params = [];
  if (q.trim()) {
    params.push(v.likePattern(q.trim()));
    where.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  if (role) {
    params.push(role);
    where.push(`role = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await db.query(`SELECT count(*)::int AS n FROM users ${whereSql}`, params);
  const { rows } = await db.query(
    `SELECT * FROM users ${whereSql} ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, size, offset],
  );
  res.json({ data: rows.map(publicUser), pagination: v.pagination(page, size, count.rows[0].n) });
});

async function updateUser(req, column, value) {
  const id = v.parseId(req.params.id);
  const { rows } = await db.query('SELECT id FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw notFound('Không tìm thấy tài khoản.');
  if (column === 'status' && id === req.user.id) {
    throw conflict('SELF_MODIFICATION', 'Bạn không thể khoá tài khoản của chính mình.');
  }
  const upd = await db.query(`UPDATE users SET ${column} = $2 WHERE id = $1 RETURNING *`, [id, value]);
  return publicUser(upd.rows[0]);
}

// FR-11 – khoá / mở khoá
router.patch('/users/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) throw badRequest({ status: 'Trạng thái là ACTIVE hoặc LOCKED' });
  res.json({ data: await updateUser(req, 'status', status) });
});

// FR-11 – đổi vai trò
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body || {};
  if (!ROLES.includes(role)) throw badRequest({ role: 'Vai trò là READER, LIBRARIAN hoặc ADMIN' });
  res.json({ data: await updateUser(req, 'role', role) });
});

module.exports = { router };
