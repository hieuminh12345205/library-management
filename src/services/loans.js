const { todayVN, diffDays, toIsoVN } = require('../utils/dates');

const LOAN_STATUSES = ['PENDING', 'BORROWING', 'OVERDUE', 'RETURNED', 'REJECTED'];
const ACTIVE_STATUSES = ['PENDING', 'BORROWING', 'OVERDUE'];
const MAX_ACTIVE_LOANS = 5; // BUS-01
const LOAN_DAYS = 14; // BUS-02
const RENEW_DAYS = 7; // BUS-03
const FINE_PER_DAY = 2000; // BUS-04
const FINE_CAP = 100000; // BUS-04

const LOAN_SELECT = `
  SELECT l.*, b.title AS book_title, b.isbn AS book_isbn, b.available_copies AS book_available,
         u.full_name AS user_full_name, u.email AS user_email
  FROM loans l
  JOIN books b ON b.id = l.book_id
  JOIN users u ON u.id = l.user_id`;

// BUS-09: chuyển phiếu quá hạn sang OVERDUE
function refreshOverdue(client) {
  return client.query("UPDATE loans SET status = 'OVERDUE' WHERE status = 'BORROWING' AND due_date < $1", [
    todayVN(),
  ]);
}

// BUS-04
function computeFine(dueDate, returnDate) {
  const overdueDays = Math.max(0, diffDays(dueDate, returnDate));
  return { overdueDays, fine: Math.min(overdueDays * FINE_PER_DAY, FINE_CAP) };
}

// Mã phiếu PM-YYYYMMDD-NNNN
async function nextLoanCode(client) {
  const day = todayVN();
  const { rows } = await client.query(
    `INSERT INTO daily_counters (day, n) VALUES ($1, 1)
     ON CONFLICT (day) DO UPDATE SET n = daily_counters.n + 1
     RETURNING n`,
    [day],
  );
  return `PM-${day.replace(/-/g, '')}-${String(rows[0].n).padStart(4, '0')}`;
}

function serializeLoan(row, { withUser = false } = {}) {
  let { overdue_days: overdueDays, fine } = row;
  // Phiếu đang quá hạn: phí tạm tính đến hôm nay
  if (row.status === 'OVERDUE') {
    overdueDays = Math.max(0, diffDays(row.due_date, todayVN()));
    fine = overdueDays * FINE_PER_DAY;
  }

  const loan = {
    id: row.id,
    code: row.code,
    status: row.status,
    book: { id: row.book_id, title: row.book_title, isbn: row.book_isbn },
    requestedAt: toIsoVN(row.requested_at),
    approvedAt: toIsoVN(row.approved_at),
    dueDate: row.due_date,
    renewCount: row.renew_count,
    returnedAt: toIsoVN(row.returned_at),
    overdueDays,
    fine,
    rejectedAt: toIsoVN(row.rejected_at),
    rejectReason: row.reject_reason,
  };
  if (withUser) {
    loan.reader = { id: row.user_id, fullName: row.user_full_name, email: row.user_email };
    loan.book.availableCopies = row.book_available;
  }
  return loan;
}

module.exports = {
  LOAN_STATUSES,
  ACTIVE_STATUSES,
  MAX_ACTIVE_LOANS,
  LOAN_DAYS,
  RENEW_DAYS,
  LOAN_SELECT,
  refreshOverdue,
  computeFine,
  nextLoanCode,
  serializeLoan,
};
