const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { badRequest } = require('../utils/errors');
const { TZ, todayVN, addDays, diffDays } = require('../utils/dates');
const L = require('../services/loans');
const v = require('../utils/validate');

const router = express.Router();
router.use(requireAuth('LIBRARIAN', 'ADMIN'));

// FR-12 – tổng quan
router.get('/summary', async (req, res) => {
  await L.refreshOverdue(db);
  const [books, readers, loans] = await Promise.all([
    db.query(
      `SELECT count(*)::int AS titles, COALESCE(sum(total_copies), 0)::int AS copies,
              COALESCE(sum(available_copies), 0)::int AS available
       FROM books WHERE deleted_at IS NULL`,
    ),
    db.query("SELECT count(*)::int AS n FROM users WHERE role = 'READER'"),
    db.query('SELECT status, count(*)::int AS n FROM loans GROUP BY status'),
  ]);
  const loansByStatus = Object.fromEntries(L.LOAN_STATUSES.map((s) => [s, 0]));
  for (const r of loans.rows) loansByStatus[r.status] = r.n;
  res.json({
    data: {
      totalTitles: books.rows[0].titles,
      totalCopies: books.rows[0].copies,
      availableCopies: books.rows[0].available,
      totalReaders: readers.rows[0].n,
      loansByStatus,
    },
  });
});

// FR-12 – sách mượn nhiều (VAL-21)
router.get('/top-books', async (req, res) => {
  const to = req.query.to || todayVN();
  const from = req.query.from || addDays(to, -29);
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (!ymd.test(from) || !ymd.test(to) || from > to || diffDays(from, to) > 366) {
    throw badRequest({ range: v.MSG.range }, v.MSG.range);
  }
  const { rows } = await db.query(
    `SELECT b.id, b.isbn, b.title, b.author, count(*)::int AS borrow_count
     FROM loans l JOIN books b ON b.id = l.book_id
     WHERE l.approved_at IS NOT NULL
       AND (l.approved_at AT TIME ZONE '${TZ}')::date BETWEEN $1 AND $2
     GROUP BY b.id
     ORDER BY borrow_count DESC, b.title ASC
     LIMIT 10`,
    [from, to],
  );
  res.json({
    data: rows.map((r) => ({ id: r.id, isbn: r.isbn, title: r.title, author: r.author, borrowCount: r.borrow_count })),
    range: { from, to },
  });
});

// FR-12 – sách quá hạn
router.get('/overdue', async (req, res) => {
  await L.refreshOverdue(db);
  const { rows } = await db.query(`${L.LOAN_SELECT} WHERE l.status = 'OVERDUE' ORDER BY l.due_date ASC, l.id ASC`);
  res.json({ data: rows.map((r) => L.serializeLoan(r, { withUser: true })) });
});

module.exports = { router };
