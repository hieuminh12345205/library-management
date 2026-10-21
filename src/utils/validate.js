const { badRequest, notFound } = require('./errors');

const NAME_RE = /^[\p{L}\s]+$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/;
const ISBN_RE = /^\d{13}$/;
const INT_RE = /^\d+$/;

const CATEGORIES = [
  'Công nghệ thông tin',
  'Kinh tế',
  'Ngoại ngữ',
  'Văn học',
  'Khoa học tự nhiên',
  'Kỹ năng',
  'Tiếng Nhật',
  'Khác',
];

const MSG = {
  fullName: 'Họ tên từ 2 đến 50 ký tự, chỉ gồm chữ cái',
  email: 'Email không hợp lệ',
  phone: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0',
  password: 'Mật khẩu 8–32 ký tự, gồm cả chữ và số',
  confirmPassword: 'Mật khẩu xác nhận không khớp',
  isbn: 'ISBN gồm đúng 13 chữ số',
  title: 'Tên sách từ 1 đến 200 ký tự',
  author: 'Tác giả từ 1 đến 100 ký tự',
  category: 'Thể loại không hợp lệ',
  publisher: 'Nhà xuất bản tối đa 100 ký tự',
  publishYear: 'Năm xuất bản từ 1900 đến năm hiện tại',
  totalCopies: 'Số bản từ 1 đến 100',
  description: 'Mô tả tối đa 2000 ký tự',
  coverUrl: 'Ảnh bìa phải là URL http/https, tối đa 500 ký tự',
  q: 'Từ khoá tối đa 100 ký tự',
  paging: 'Tham số phân trang không hợp lệ',
  reason: 'Lý do từ chối từ 5 đến 200 ký tự',
  range: 'Khoảng thời gian không hợp lệ',
};

const isStr = (v) => typeof v === 'string';
const trimmed = (v) => (isStr(v) ? v.trim() : '');

function isValidName(v) {
  const s = trimmed(v);
  return s.length >= 2 && s.length <= 50 && NAME_RE.test(s);
}
function isValidEmail(v) {
  const s = trimmed(v);
  return s.length <= 100 && EMAIL_RE.test(s);
}
function isValidPassword(v) {
  return isStr(v) && v.length >= 8 && v.length <= 32 && /\p{L}/u.test(v) && /\d/.test(v);
}

// Số nguyên dương trong path → nếu sai trả 404 (FR-04, FR-06...)
function parseId(raw) {
  if (!isStr(raw) || !/^[1-9]\d*$/.test(raw)) throw notFound();
  return Number(raw);
}

// VR-16
function parsePaging(query) {
  const { page = '1', size = '10' } = query;
  if (!INT_RE.test(String(page)) || !INT_RE.test(String(size))) {
    throw badRequest({ paging: MSG.paging }, MSG.paging);
  }
  const p = Number(page);
  const s = Number(size);
  if (p < 1 || s < 1 || s > 50) throw badRequest({ paging: MSG.paging }, MSG.paging);
  return { page: p, size: s, offset: (p - 1) * s };
}

function pagination(page, size, totalItems) {
  return { page, size, totalItems, totalPages: Math.ceil(totalItems / size) };
}

// Chuỗi dùng trong ILIKE – thoát ký tự đại diện
function likePattern(s) {
  return `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

module.exports = {
  CATEGORIES,
  MSG,
  ISBN_RE,
  PHONE_RE,
  isStr,
  trimmed,
  isValidName,
  isValidEmail,
  isValidPassword,
  parseId,
  parsePaging,
  pagination,
  likePattern,
};
