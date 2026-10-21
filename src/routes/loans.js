const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { todayVN, addDays } = require('../utils/dates');
const L = require('../services/loans');
const v = require('../utils/validate');

const router = express.Router();
router.use(requireAuth('READER'));

async function loadOwnLoan(client, id, userId, lock = false) {
  const { rows } = await client.query(
    `${L.LOAN_SELECT} WHERE l.id = $1 AND l.user_id = $2${lock ? ' FOR UPDATE OF l' : ''}`,
    [id, userId],
  );
  if (!rows[0]) throw notFound('Không tìm thấy phiếu mượn.');
  return rows[0];
}

// FR-05 – bảng quyết định 4.1
router.post('/', async (req, res) => {
  const { bookId } = req.body || {};
  if (!Number.isInteger(bookId) || bookId < 1) throw badRequest({ bookId: 'Mã sách không hợp lệ' });

  const loan = await db.transaction(async (client) => {
    await L.refreshOverdue(client);
    // Khoá theo độc giả để hai yêu cầu đồng thời không vượt BR-01
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);

    const bookRes = await client.query('SELECT * FROM books WHERE id = $1 AND deleted_at IS NULL', [bookId]);
    const book = bookRes.rows[0];
    if (!book) throw notFound('Không tìm thấy sách.');

    const { rows } = await client.query(
      'SELECT book_id, status FROM loans WHERE user_id = $1 AND status = ANY($2)',
      [req.user.id, L.ACTIVE_STATUSES],
    );
    if (rows.length > L.MAX_ACTIVE_LOANS) {
      throw conflict('LOAN_LIMIT_REACHED', 'Bạn đã mượn tối đa 5 cuốn. Vui lòng trả bớt sách trước khi mượn thêm.');
    }
    if (rows.some((r) => r.status === 'OVERDUE')) {
      throw conflict('HAS_OVERDUE_LOAN', 'Bạn đang có sách quá hạn. Vui lòng trả sách trước khi mượn thêm.');
    }
    if (rows.some((r) => r.book_id === bookId)) {
      throw conflict('DUPLICATE_LOAN', 'Bạn đã có yêu cầu hoặc đang mượn cuốn sách này.');
    }
    if (book.available_copies <= 0) throw conflict('OUT_OF_STOCK', 'Sách đã hết, vui lòng quay lại sau.');

    const code = await L.nextLoanCode(client);
    const ins = await client.query(
      "INSERT INTO loans (code, user_id, book_id, status) VALUES ($1, $2, $3, 'PENDING') RETURNING id",
      [code, req.user.id, bookId],
    );
    return loadOwnLoan(client, ins.rows[0].id, req.user.id);
  });
  res.status(201).json({ data: L.serializeLoan(loan) });
});

// FR-06
router.get('/me', async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && status !== '' && !L.LOAN_STATUSES.includes(status)) {
    throw badRequest({ status: 'Trạng thái không hợp lệ' });
  }
  const { page, size, offset } = v.parsePaging(req.query);
  await L.refreshOverdue(db);

  const params = [req.user.id];
  let where = 'l.user_id = $1';
  if (status) {
    params.push(status);
    where += ' AND l.status = $2';
  }
  const count = await db.query(`SELECT count(*)::int AS n FROM loans l WHERE ${where}`, params);
  const { rows } = await db.query(
    `${L.LOAN_SELECT} WHERE ${where} ORDER BY l.requested_at DESC, l.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, size, offset],
  );
  res.json({ data: rows.map((r) => L.serializeLoan(r)), pagination: v.pagination(page, size, count.rows[0].n) });
});

router.get('/:id', async (req, res) => {
  const id = v.parseId(req.params.id);
  await L.refreshOverdue(db);
  const loan = await loadOwnLoan(db, id, req.user.id);
  res.json({ data: L.serializeLoan(loan) });
});

// FR-07 – bảng quyết định 4.2
router.post('/:id/renew', async (req, res) => {
  const id = v.parseId(req.params.id);
  const loan = await db.transaction(async (client) => {
    await L.refreshOverdue(client);
    const cur = await loadOwnLoan(client, id, req.user.id, true);
    if (cur.status !== 'BORROWING') {
      throw conflict('INVALID_STATUS', 'Chỉ gia hạn được phiếu đang mượn và chưa quá hạn.');
    }
    if (cur.renew_count >= 1) throw conflict('RENEW_LIMIT_REACHED', 'Mỗi phiếu chỉ được gia hạn 1 lần.');
    await client.query('UPDATE loans SET due_date = $2, renew_count = renew_count + 1 WHERE id = $1', [
      id,
      addDays(todayVN(), L.RENEW_DAYS),
    ]);
    return loadOwnLoan(client, id, req.user.id);
  });
  res.json({ data: L.serializeLoan(loan) });
});

module.exports = { router };
