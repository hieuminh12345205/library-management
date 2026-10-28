// Tạo dữ liệu mẫu. Dùng: npm run seed            (chỉ chạy khi DB trống)
//                      npm run seed -- --force  (XOÁ toàn bộ dữ liệu rồi tạo lại)
const { initializeSchema } = require('./initialize');
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const config = require('../src/config');
const { todayVN, addDays } = require('../src/utils/dates');
const { computeFine } = require('../src/services/loans');

const PASSWORD = 'Test@123';

// PRNG cố định để lần chạy nào cũng ra cùng dữ liệu
let seed = 20261002;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];

const USERS = [
  ['Quản Trị Viên', 'admin01@library.test', '0901000001', 'ADMIN', 'ACTIVE'],
  ['Trần Thị Thu', 'librarian01@library.test', '0902000001', 'LIBRARIAN', 'ACTIVE'],
  ['Lê Văn Hùng', 'librarian02@library.test', '0902000002', 'LIBRARIAN', 'ACTIVE'],
  ['Nguyễn Văn An', 'reader01@library.test', '0903000001', 'READER', 'ACTIVE'],
  ['Phạm Thị Bình', 'reader02@library.test', '0903000002', 'READER', 'ACTIVE'],
  ['Hoàng Minh Châu', 'reader03@library.test', '0903000003', 'READER', 'ACTIVE'],
  ['Đỗ Quang Dũng', 'reader04@library.test', '0903000004', 'READER', 'ACTIVE'],
  ['Vũ Thị Hà', 'reader05@library.test', '0903000005', 'READER', 'ACTIVE'],
  ['Bùi Đức Khang', 'reader06@library.test', '0903000006', 'READER', 'ACTIVE'],
  ['Ngô Thị Lan', 'reader07@library.test', '0903000007', 'READER', 'ACTIVE'],
  ['Đặng Văn Long', 'reader08@library.test', '0903000008', 'READER', 'ACTIVE'],
  ['Phan Thị Mai', 'reader09@library.test', '0903000009', 'READER', 'ACTIVE'],
  ['Trịnh Công Nam', 'reader10@library.test', '0903000010', 'READER', 'ACTIVE'],
  ['Lý Thị Oanh', 'reader11@library.test', '0903000011', 'READER', 'ACTIVE'],
  ['Mai Văn Phúc', 'reader12@library.test', '0903000012', 'READER', 'ACTIVE'],
  ['Tạ Thị Quyên', 'locked01@library.test', '0903000099', 'READER', 'LOCKED'],
  ['Quản Trị Viên 2', 'admin02@library.test', '0901000002', 'ADMIN', 'ACTIVE'],
];

// [tên, tác giả, thể loại, nhà xuất bản, năm, số bản]
const BOOKS = [
  ['Clean Code', 'Robert C. Martin', 'Công nghệ thông tin', 'Prentice Hall', 2008, 5],
  ['The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 'Công nghệ thông tin', 'Addison-Wesley', 2019, 4],
  ['Design Patterns', 'Erich Gamma và cộng sự', 'Công nghệ thông tin', 'Addison-Wesley', 1994, 3],
  ['Refactoring', 'Martin Fowler', 'Công nghệ thông tin', 'Addison-Wesley', 2018, 3],
  ['Introduction to Algorithms', 'Thomas H. Cormen và cộng sự', 'Công nghệ thông tin', 'MIT Press', 2022, 6],
  ['Cấu trúc dữ liệu và giải thuật', 'Đỗ Xuân Lôi', 'Công nghệ thông tin', 'NXB Đại học Quốc gia Hà Nội', 2015, 8],
  ['Lập trình hướng đối tượng với Java', 'Đoàn Văn Ban', 'Công nghệ thông tin', 'NXB Khoa học và Kỹ thuật', 2017, 6],
  ['Cơ sở dữ liệu', 'Nguyễn Kim Anh', 'Công nghệ thông tin', 'NXB Đại học Quốc gia Hà Nội', 2016, 5],
  ['Software Testing: A Craftsman\'s Approach', 'Paul C. Jorgensen', 'Công nghệ thông tin', 'CRC Press', 2021, 4],
  ['Lessons Learned in Software Testing', 'Cem Kaner và cộng sự', 'Công nghệ thông tin', 'Wiley', 2001, 2],
  ['Kiểm thử phần mềm', 'Phạm Ngọc Hùng', 'Công nghệ thông tin', 'NXB Đại học Quốc gia Hà Nội', 2014, 7],
  ['Computer Networking: A Top-Down Approach', 'James F. Kurose', 'Công nghệ thông tin', 'Pearson', 2021, 4],
  ['Operating System Concepts', 'Abraham Silberschatz', 'Công nghệ thông tin', 'Wiley', 2018, 4],
  ['JavaScript: The Good Parts', 'Douglas Crockford', 'Công nghệ thông tin', "O'Reilly", 2008, 3],
  ['Eloquent JavaScript', 'Marijn Haverbeke', 'Công nghệ thông tin', 'No Starch Press', 2018, 3],
  ['Python Crash Course', 'Eric Matthes', 'Công nghệ thông tin', 'No Starch Press', 2023, 5],
  ['Deep Learning', 'Ian Goodfellow và cộng sự', 'Công nghệ thông tin', 'MIT Press', 2016, 2],
  ['Site Reliability Engineering', 'Betsy Beyer và cộng sự', 'Công nghệ thông tin', "O'Reilly", 2016, 2],
  ['The Art of Application Performance Testing', 'Ian Molyneaux', 'Công nghệ thông tin', "O'Reilly", 2014, 1],
  ['Kinh tế học vi mô', 'N. Gregory Mankiw', 'Kinh tế', 'NXB Cengage', 2020, 6],
  ['Kinh tế học vĩ mô', 'N. Gregory Mankiw', 'Kinh tế', 'NXB Cengage', 2020, 6],
  ['Nguyên lý kế toán', 'Võ Văn Nhị', 'Kinh tế', 'NXB Tài chính', 2019, 5],
  ['Quản trị học', 'Nguyễn Thị Liên Diệp', 'Kinh tế', 'NXB Lao động', 2018, 4],
  ['Marketing căn bản', 'Philip Kotler', 'Kinh tế', 'NXB Lao động Xã hội', 2017, 4],
  ['Người giàu có nhất thành Babylon', 'George S. Clason', 'Kinh tế', 'NXB Tổng hợp TP.HCM', 2020, 3],
  ['English Grammar in Use', 'Raymond Murphy', 'Ngoại ngữ', 'Cambridge University Press', 2019, 8],
  ['Cambridge IELTS 18', 'Cambridge University Press', 'Ngoại ngữ', 'Cambridge University Press', 2023, 5],
  ['Oxford Advanced Learner\'s Dictionary', 'A. S. Hornby', 'Ngoại ngữ', 'Oxford University Press', 2020, 2],
  ['Hackers TOEIC Reading', 'Hackers Language Research Institute', 'Ngoại ngữ', 'NXB Thế giới', 2021, 4],
  ['Minna no Nihongo Sơ cấp 1', '3A Corporation', 'Tiếng Nhật', 'NXB Trẻ', 2019, 10],
  ['Minna no Nihongo Sơ cấp 2', '3A Corporation', 'Tiếng Nhật', 'NXB Trẻ', 2019, 8],
  ['Soumatome N3 Ngữ pháp', 'Sasaki Hitoko', 'Tiếng Nhật', 'NXB Tổng hợp TP.HCM', 2020, 6],
  ['Shin Kanzen Master N2 Đọc hiểu', 'Nhiều tác giả', 'Tiếng Nhật', 'NXB Tổng hợp TP.HCM', 2021, 5],
  ['Kanji Look and Learn', 'Eri Banno và cộng sự', 'Tiếng Nhật', 'The Japan Times', 2017, 4],
  ['Tuyển tập đề thi JLPT N3', 'Nhiều tác giả', 'Tiếng Nhật', 'NXB Hồng Đức', 2022, 3],
  ['Số đỏ', 'Vũ Trọng Phụng', 'Văn học', 'NXB Văn học', 2016, 4],
  ['Truyện Kiều', 'Nguyễn Du', 'Văn học', 'NXB Văn học', 2015, 5],
  ['Dế Mèn phiêu lưu ký', 'Tô Hoài', 'Văn học', 'NXB Kim Đồng', 2020, 6],
  ['Tắt đèn', 'Ngô Tất Tố', 'Văn học', 'NXB Văn học', 2017, 3],
  ['Nhà giả kim', 'Paulo Coelho', 'Văn học', 'NXB Hội Nhà văn', 2020, 5],
  ['Rừng Na Uy', 'Haruki Murakami', 'Văn học', 'NXB Hội Nhà văn', 2018, 3],
  ['Tôi thấy hoa vàng trên cỏ xanh', 'Nguyễn Nhật Ánh', 'Văn học', 'NXB Trẻ', 2018, 6],
  ['Mắt biếc', 'Nguyễn Nhật Ánh', 'Văn học', 'NXB Trẻ', 2019, 4],
  ['Totto-chan bên cửa sổ', 'Kuroyanagi Tetsuko', 'Văn học', 'NXB Hội Nhà văn', 2019, 3],
  ['Lược sử thời gian', 'Stephen Hawking', 'Khoa học tự nhiên', 'NXB Trẻ', 2018, 3],
  ['Vũ trụ', 'Carl Sagan', 'Khoa học tự nhiên', 'NXB Thế giới', 2019, 2],
  ['Sapiens: Lược sử loài người', 'Yuval Noah Harari', 'Khoa học tự nhiên', 'NXB Tri thức', 2018, 5],
  ['Giải tích 1', 'Nguyễn Đình Trí', 'Khoa học tự nhiên', 'NXB Giáo dục', 2016, 9],
  ['Đại số tuyến tính', 'Nguyễn Hữu Việt Hưng', 'Khoa học tự nhiên', 'NXB Đại học Quốc gia Hà Nội', 2015, 7],
  ['Xác suất thống kê', 'Tống Đình Quỳ', 'Khoa học tự nhiên', 'NXB Bách khoa Hà Nội', 2017, 6],
  ['Vật lý đại cương', 'Lương Duyên Bình', 'Khoa học tự nhiên', 'NXB Giáo dục', 2014, 6],
  ['Đắc nhân tâm', 'Dale Carnegie', 'Kỹ năng', 'NXB Tổng hợp TP.HCM', 2019, 6],
  ['Tư duy nhanh và chậm', 'Daniel Kahneman', 'Kỹ năng', 'NXB Thế giới', 2020, 3],
  ['Atomic Habits', 'James Clear', 'Kỹ năng', 'NXB Thế giới', 2021, 4],
  ['7 thói quen hiệu quả', 'Stephen R. Covey', 'Kỹ năng', 'NXB Tổng hợp TP.HCM', 2018, 4],
  ['Nghệ thuật thuyết trình', 'Nhiều tác giả', 'Kỹ năng', 'NXB Lao động', 2017, 3],
  ['Kỹ năng viết báo cáo khoa học', 'Nhiều tác giả', 'Kỹ năng', 'NXB Đại học Quốc gia Hà Nội', 2016, 2],
  ['Sổ tay sinh viên Đại học Việt Nhật', 'Trường Đại học Việt Nhật', 'Khác', 'Trường Đại học Việt Nhật', 2024, 2],
  ['Lịch sử Việt Nam', 'Trần Trọng Kim', 'Khác', 'NXB Văn học', 2018, 3],
  ['Văn hoá Nhật Bản', 'Nhiều tác giả', 'Khác', 'NXB Thế giới', 2020, 2],
];

function isbnFor(i) {
  return `978604${String(1000000 + i * 7919).slice(-7)}`;
}

// Mốc thời gian VN: ngày 'YYYY-MM-DD' + giờ → ISO
const at = (ymd, hour = 9, minute = 0) =>
  `${ymd}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`;

async function main() {
  const force = process.argv.includes('--force');
  await initializeSchema();

  const existing = await db.query('SELECT count(*)::int AS n FROM users');
  if (existing.rows[0].n > 0 && !force) {
    console.log('Cơ sở dữ liệu đã có dữ liệu. Chạy "npm run seed -- --force" nếu muốn xoá và tạo lại.');
    return;
  }

  const today = todayVN();
  await db.transaction(async (client) => {
    await client.query('TRUNCATE loans, books, users, daily_counters, revoked_tokens RESTART IDENTITY CASCADE');

    // --- Tài khoản ---
    const hash = await bcrypt.hash(PASSWORD, config.bcryptCost);
    const userIds = {};
    for (const [i, [name, email, phone, role, status]] of USERS.entries()) {
      const { rows } = await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [name, email, phone, hash, role, status, at(addDays(today, -200 + i), 8)],
      );
      userIds[email.split('@')[0]] = rows[0].id;
    }
    const librarianId = userIds.librarian01;

    // --- Đầu sách ---
    const books = [];
    for (const [i, [title, author, category, publisher, year, copies]] of BOOKS.entries()) {
      const { rows } = await client.query(
        `INSERT INTO books (isbn, title, author, category, publisher, publish_year, total_copies, available_copies, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $9) RETURNING id`,
        [
          isbnFor(i),
          title,
          author,
          category,
          publisher,
          year,
          copies,
          `${title} – ${author}. Sách thuộc nhóm ${category.toLowerCase()}, xuất bản năm ${year} bởi ${publisher}.`,
          at(addDays(today, -190 + i), 10),
        ],
      );
      books.push({ id: rows[0].id, total: copies, borrowed: 0, title });
    }

    // --- Phiếu mượn ---
    const counters = {};
    const loans = [];
    const usedActive = new Set(); // userId:bookId của phiếu chưa kết thúc (BR-07)

    function addLoan(user, book, status, { requested, approvedOffset = 1, returnOffset, renew = 0, reason }) {
      const key = requested.replace(/-/g, '');
      counters[requested] = (counters[requested] || 0) + 1;
      const loan = {
        code: `PM-${key}-${String(counters[requested]).padStart(4, '0')}`,
        user_id: userIds[user],
        book_id: book.id,
        status,
        requested_at: at(requested, randInt(7, 20), randInt(0, 59)),
        approved_at: null,
        approved_by: null,
        due_date: null,
        renew_count: renew,
        returned_at: null,
        returned_by: null,
        overdue_days: 0,
        fine: 0,
        rejected_at: null,
        reject_reason: null,
      };
      if (status === 'REJECTED') {
        loan.rejected_at = at(addDays(requested, 1), 10);
        loan.reject_reason = reason || 'Sách đang được bảo trì, vui lòng mượn sau.';
      }
      if (['BORROWING', 'OVERDUE', 'RETURNED'].includes(status)) {
        const approved = addDays(requested, approvedOffset);
        loan.approved_at = at(approved, 14);
        loan.approved_by = librarianId;
        loan.due_date = addDays(approved, 14 + renew * 7);
      }
      if (status === 'RETURNED') {
        const returned = addDays(loan.approved_at.slice(0, 10), returnOffset);
        loan.returned_at = at(returned, 16);
        loan.returned_by = librarianId;
        Object.assign(loan, (({ overdueDays, fine }) => ({ overdue_days: overdueDays, fine }))(computeFine(loan.due_date, returned)));
      }
      if (['BORROWING', 'OVERDUE'].includes(status)) book.borrowed += 1;
      if (['PENDING', 'BORROWING', 'OVERDUE'].includes(status)) usedActive.add(`${loan.user_id}:${book.id}`);
      loans.push(loan);
    }
    const B = (title) => books.find((b) => b.title === title);
    const ago = (n) => addDays(today, -n);

    // reader01: tài khoản minh hoạ đủ trạng thái
    addLoan('reader01', B('Clean Code'), 'BORROWING', { requested: ago(5) });
    addLoan('reader01', B('Refactoring'), 'BORROWING', { requested: ago(12), renew: 1 });
    addLoan('reader01', B('Eloquent JavaScript'), 'PENDING', { requested: ago(1) });
    addLoan('reader01', B('Design Patterns'), 'RETURNED', { requested: ago(60), returnOffset: 10 });
    addLoan('reader01', B('Kiểm thử phần mềm'), 'RETURNED', { requested: ago(45), returnOffset: 19 });
    addLoan('reader01', B('Deep Learning'), 'REJECTED', { requested: ago(20), reason: 'Bản sách bị hỏng, đang chờ thay thế.' });
    // reader02: đã giữ đủ 5 cuốn (BR-01)
    addLoan('reader02', B('Kinh tế học vi mô'), 'BORROWING', { requested: ago(3) });
    addLoan('reader02', B('Kinh tế học vĩ mô'), 'BORROWING', { requested: ago(3) });
    addLoan('reader02', B('Nguyên lý kế toán'), 'BORROWING', { requested: ago(8) });
    addLoan('reader02', B('Quản trị học'), 'PENDING', { requested: ago(1) });
    addLoan('reader02', B('Marketing căn bản'), 'PENDING', { requested: ago(0) });
    // reader03: có sách quá hạn (BR-05)
    addLoan('reader03', B('Lược sử thời gian'), 'OVERDUE', { requested: ago(25) });
    addLoan('reader03', B('Atomic Habits'), 'BORROWING', { requested: ago(4) });
    // reader04: tài khoản mới, chưa mượn
    // reader05: quá hạn lâu – phí chạm trần 100.000 đ
    addLoan('reader05', B('Số đỏ'), 'OVERDUE', { requested: ago(75) });
    // Sách hết bản: 1 bản duy nhất đang được mượn
    addLoan('reader06', B('The Art of Application Performance Testing'), 'BORROWING', { requested: ago(6) });
    // Thêm vài yêu cầu chờ duyệt cho thủ thư
    addLoan('reader07', B('Minna no Nihongo Sơ cấp 1'), 'PENDING', { requested: ago(2) });
    addLoan('reader08', B('English Grammar in Use'), 'PENDING', { requested: ago(1) });
    addLoan('reader09', B('Nhà giả kim'), 'PENDING', { requested: ago(0) });
    addLoan('reader10', B('Sapiens: Lược sử loài người'), 'OVERDUE', { requested: ago(20) });

    // Lịch sử ngẫu nhiên cho thống kê – độc giả 06 → 12
    const randomReaders = ['reader06', 'reader07', 'reader08', 'reader09', 'reader10', 'reader11', 'reader12'];
    const popular = books.filter((b) => b.total >= 4);
    for (let i = 0; i < 90; i++) {
      const book = rand() < 0.6 ? pick(popular) : pick(books);
      const requested = ago(randInt(20, 180));
      if (rand() < 0.1) {
        addLoan(pick(randomReaders), book, 'REJECTED', { requested, reason: 'Độc giả chưa hoàn tất thủ tục thẻ thư viện.' });
      } else {
        // 75% trả đúng hạn, 25% trả trễ 1–20 ngày
        const returnOffset = rand() < 0.75 ? randInt(3, 14) : randInt(15, 34);
        addLoan(pick(randomReaders), book, 'RETURNED', { requested, returnOffset });
      }
    }
    // Một số phiếu đang mượn của độc giả 11, 12
    for (const user of ['reader11', 'reader12']) {
      for (let k = 0; k < 2; k++) {
        const candidates = books.filter((b) => b.total - b.borrowed >= 2 && !usedActive.has(`${userIds[user]}:${b.id}`));
        addLoan(user, pick(candidates), 'BORROWING', { requested: ago(randInt(1, 10)) });
      }
    }

    for (const l of loans) {
      await client.query(
        `INSERT INTO loans (code, user_id, book_id, status, requested_at, approved_at, approved_by, due_date, renew_count,
                            returned_at, returned_by, overdue_days, fine, rejected_at, reject_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [l.code, l.user_id, l.book_id, l.status, l.requested_at, l.approved_at, l.approved_by, l.due_date, l.renew_count,
          l.returned_at, l.returned_by, l.overdue_days, l.fine, l.rejected_at, l.reject_reason],
      );
    }
    for (const b of books) {
      if (b.borrowed > b.total) throw new Error(`Dữ liệu mẫu sai: ${b.title} cho mượn quá số bản`);
      await client.query('UPDATE books SET available_copies = $2 WHERE id = $1', [b.id, b.total - b.borrowed]);
    }
    for (const [day, n] of Object.entries(counters)) {
      await client.query('INSERT INTO daily_counters (day, n) VALUES ($1, $2)', [day, n]);
    }
    console.log(`Đã tạo ${USERS.length} tài khoản, ${books.length} đầu sách, ${loans.length} phiếu mượn.`);
    console.log(`Mật khẩu mọi tài khoản mẫu: ${PASSWORD}`);
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
