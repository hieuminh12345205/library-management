const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { todayVN, addDays } = require('../utils/dates');
const L = require('../services/loans');
const v = require('../utils/validate');

const router = express.Router();
router.use(requireAuth('LIBRARIAN'));

async function loadLoan(client, id, lock = false) {
  const { rows } = await client.query(`${L.LOAN_SELECT} WHERE l.id = $1${lock ? ' FOR UPDATE OF l' : ''}`, [id]);
  if (!rows[0]) throw notFound('Không tìm thấy phiếu mượn.');
  return rows[0];
}

// FR-08, FR-09 – danh sách phiếu
router.get('/loans', async (req, res) => {
  const { status, q = '' } = req.query;
  const fields = {};
  if (status !== undefined && status !== '' && !L.LOAN_STATUSES.includes(status)) fields.status = 'Trạng thái không hợp lệ';
  if (!v.isStr(q) || q.length > 100) fields.q = v.MSG.q;
  if (Object.keys(fields).length) throw badRequest(fields);
  const { page, size, offset } = v.parsePaging(req.query);
  await L.refreshOverdue(db);

  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`l.status = $${params.length}`);
  }
  if (q.trim()) {
    params.push(v.likePattern(q.trim()));
    where.push(`(l.code ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  // Chờ duyệt: ai gửi trước xử lý trước
  const order = status === 'PENDING' ? 'l.requested_at ASC, l.id ASC' : 'l.requested_at DESC, l.id DESC';

  const count = await db.query(
    `SELECT count(*)::int AS n FROM loans l JOIN users u ON u.id = l.user_id ${whereSql}`,
    params,
  );
  const { rows } = await db.query(
    `${L.LOAN_SELECT} ${whereSql} ORDER BY ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, size, offset],
  );
  res.json({
    data: rows.map((r) => L.serializeLoan(r, { withUser: true })),
    pagination: v.pagination(page, size, count.rows[0].n),
  });
});

// FR-08 – duyệt
router.post('/loans/:id/approve', async (req, res) => {
  const id = v.parseId(req.params.id);
  const loan = await db.transaction(async (client) => {
    const cur = await loadLoan(client, id, true);
    if (cur.status !== 'PENDING') throw conflict('INVALID_STATUS', 'Chỉ duyệt được phiếu đang chờ duyệt.');
    // Giảm tồn kho nguyên tử – chỉ thành công khi còn bản (BR-06, BR-08)
    const dec = await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1 AND available_copies > 0 RETURNING id',
      [cur.book_id],
    );
    if (!dec.rowCount) throw conflict('OUT_OF_STOCK', 'Sách đã hết, không thể duyệt.');
    await client.query(
      "UPDATE loans SET status = 'BORROWING', approved_at = now(), approved_by = $2, due_date = $3 WHERE id = $1",
      [id, req.user.id, addDays(todayVN(), L.LOAN_DAYS)],
    );
    return loadLoan(client, id);
  });
  res.json({ data: L.serializeLoan(loan, { withUser: true }) });
});

// FR-08 – từ chối
router.post('/loans/:id/reject', async (req, res) => {
  const id = v.parseId(req.params.id);
  const reason = v.trimmed((req.body || {}).reason);
  if (!v.isStr((req.body || {}).reason) || reason.length < 5 || reason.length > 200) {
    throw badRequest({ reason: v.MSG.reason });
  }
  const loan = await db.transaction(async (client) => {
    const cur = await loadLoan(client, id, true);
    if (cur.status !== 'PENDING') throw conflict('INVALID_STATUS', 'Chỉ từ chối được phiếu đang chờ duyệt.');
    await client.query(
      "UPDATE loans SET status = 'REJECTED', rejected_at = now(), reject_reason = $2 WHERE id = $1",
      [id, reason],
    );
    await client.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [cur.book_id]);
    return loadLoan(client, id);
  });
  res.json({ data: L.serializeLoan(loan, { withUser: true }) });
});

// FR-09 – xác nhận trả
router.post('/loans/:id/return', async (req, res) => {
  const id = v.parseId(req.params.id);
  const loan = await db.transaction(async (client) => {
    await L.refreshOverdue(client);
    const cur = await loadLoan(client, id, true);
    if (!['BORROWING', 'OVERDUE'].includes(cur.status)) {
      throw conflict('INVALID_STATUS', 'Chỉ xác nhận trả được phiếu đang mượn hoặc quá hạn.');
    }
    const { overdueDays, fine } = L.computeFine(cur.due_date, todayVN());
    await client.query(
      `UPDATE loans SET status = 'RETURNED', returned_at = now(), returned_by = $2, overdue_days = $3, fine = $4
       WHERE id = $1`,
      [id, req.user.id, overdueDays, fine],
    );
    await client.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [cur.book_id]);
    return loadLoan(client, id);
  });
  res.json({ data: L.serializeLoan(loan, { withUser: true }) });
});

module.exports = { router };
