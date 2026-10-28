const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const L = require('../services/loans');

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

module.exports = { router };
