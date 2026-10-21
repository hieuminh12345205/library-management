const TZ = 'Asia/Ho_Chi_Minh';
const DAY_MS = 86400000;

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Ngày hiện tại theo giờ Việt Nam, dạng 'YYYY-MM-DD'
function todayVN(now = new Date()) {
  return ymdFormatter.format(now);
}

function addDays(ymd, n) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Số ngày từ a đến b (b - a)
function diffDays(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

function isValidYmd(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

// Timestamp → ISO 8601 theo giờ Việt Nam, ví dụ 2026-10-12T19:30:00+07:00
function toIsoVN(value) {
  if (!value) return null;
  const shifted = new Date(new Date(value).getTime() + 7 * 3600000);
  return `${shifted.toISOString().slice(0, 19)}+07:00`;
}

module.exports = { TZ, todayVN, addDays, diffDays, isValidYmd, toIsoVN };
