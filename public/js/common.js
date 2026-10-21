// Dùng chung cho mọi trang: gọi API, phiên đăng nhập, header, định dạng.
const App = (() => {
  const TOKEN_KEY = 'lh_token';
  const USER_KEY = 'lh_user';

  const ROLE_LABEL = { READER: 'Độc giả', LIBRARIAN: 'Thủ thư', ADMIN: 'Quản trị viên' };
  const STATUS_LABEL = {
    PENDING: 'Chờ duyệt',
    BORROWING: 'Đang mượn',
    OVERDUE: 'Quá hạn',
    RETURNED: 'Đã trả',
    REJECTED: 'Đã từ chối',
  };
  const HOME_BY_ROLE = { READER: '/', LIBRARIAN: '/librarian/', ADMIN: '/admin/' };

  // ---------- Phiên ----------
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }
  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* bỏ qua */ }
  }

  // ---------- API ----------
  class ApiError extends Error {
    constructor(status, body) {
      super((body && body.message) || 'Có lỗi xảy ra, vui lòng thử lại.');
      this.status = status;
      this.code = body && body.error;
      this.fields = (body && body.fields) || {};
    }
  }

  async function api(path, { method = 'GET', body, query } = {}) {
    let url = `/api${path}`;
    if (query) {
      const qs = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v);
      });
      const s = qs.toString();
      if (s) url += `?${s}`;
    }
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let res;
    try {
      res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch {
      throw new ApiError(0, { message: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng.' });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Token hết hạn / bị thu hồi / tài khoản bị khoá → đăng nhập lại (MSG-15)
      if (token && (res.status === 401 || (data && data.error === 'ACCOUNT_LOCKED'))) {
        clearSession();
        const reason = res.status === 401 ? 'expired' : 'locked';
        location.href = `/login.html?reason=${reason}&next=${encodeURIComponent(location.pathname + location.search)}`;
        await new Promise(() => {}); // dừng luồng xử lý cho tới khi chuyển trang
      }
      throw new ApiError(res.status, data);
    }
    return data;
  }

  // ---------- Định dạng (NFR-11) ----------
  function formatMoney(n) {
    return `${Number(n || 0).toLocaleString('vi-VN')} đ`;
  }
  function formatDate(value) {
    if (!value) return '—';
    const ymd = String(value).slice(0, 10);
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }
  function formatDateTime(value) {
    if (!value) return '—';
    const s = String(value);
    return `${formatDate(s)} ${s.slice(11, 16)}`;
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function statusBadge(status) {
    return `<span class="badge badge-${status}">${STATUS_LABEL[status] || status}</span>`;
  }

  // Ảnh bìa mặc định: SVG theo thể loại
  const COVER_COLORS = {
    'Công nghệ thông tin': '#1f5fa8',
    'Kinh tế': '#1e824c',
    'Ngoại ngữ': '#8e44ad',
    'Văn học': '#c0392b',
    'Khoa học tự nhiên': '#16a085',
    'Kỹ năng': '#d35400',
    'Tiếng Nhật': '#b03a5b',
    Khác: '#566573',
  };
  function defaultCover(book) {
    const color = COVER_COLORS[book.category] || '#566573';
    const title = escapeHtml(book.title).slice(0, 60);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
      <rect width="300" height="400" fill="${color}"/>
      <rect x="20" y="20" width="260" height="360" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <foreignObject x="36" y="120" width="228" height="200">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff;font:600 24px Segoe UI,Arial,sans-serif;text-align:center;line-height:1.3">${title}</div>
      </foreignObject>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function coverSrc(book) {
    return book.coverUrl || defaultCover(book);
  }

  // ---------- Thông báo ----------
  function showAlert(el, type, message) {
    el.className = `alert alert-${type}`;
    el.textContent = message;
    el.classList.remove('hidden');
  }
  function toast(message, type = 'success') {
    let box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      document.body.appendChild(box);
    }
    const item = document.createElement('div');
    item.className = `alert alert-${type}`;
    item.textContent = message;
    box.appendChild(item);
    setTimeout(() => item.remove(), 4000);
  }

  // Hiển thị lỗi 400 vào từng ô: phần tử <div class="field-error" data-for="email">
  function showFieldErrors(form, fields) {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
    Object.entries(fields || {}).forEach(([name, msg]) => {
      const err = form.querySelector(`.field-error[data-for="${name}"]`);
      if (err) err.textContent = msg;
      const input = form.querySelector(`[name="${name}"]`);
      if (input) input.classList.add('input-error');
    });
  }

  // ---------- Header ----------
  const NAV = {
    GUEST: [['/', 'Tìm sách']],
    READER: [['/', 'Tìm sách'], ['/history.html', 'Lịch sử mượn']],
    LIBRARIAN: [
      ['/librarian/', 'Yêu cầu chờ duyệt'],
      ['/librarian/loans.html', 'Phiếu mượn'],
      ['/librarian/books.html', 'Quản lý sách'],
      ['/stats.html', 'Thống kê'],
      ['/', 'Tìm sách'],
    ],
    ADMIN: [['/admin/', 'Tài khoản'], ['/stats.html', 'Thống kê'], ['/', 'Tìm sách']],
  };

  function renderHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const user = getUser();
    const links = NAV[user ? user.role : 'GUEST'] || NAV.GUEST;
    const path = location.pathname.replace(/index\.html$/, '');
    const nav = links
      .map(([href, text]) => `<a href="${href}" class="${path.startsWith(href) ? 'active' : ''}">${text}</a>`)
      .join('');
    const right = user
      ? `<span>${escapeHtml(user.fullName)} <span class="role">(${ROLE_LABEL[user.role]})</span></span>
         <button type="button" class="btn-sm" id="logout-btn">Đăng xuất</button>`
      : '<a href="/login.html">Đăng nhập</a><a href="/register.html">Đăng ký</a>';
    header.className = 'site-header';
    header.innerHTML = `<div class="inner">
      <a class="brand" href="${user ? HOME_BY_ROLE[user.role] : '/'}">📚 LibraryHub</a>
      <nav class="nav">${nav}</nav>
      <div class="user-box">${right}</div>
    </div>`;
    const btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', logout);
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* token có thể đã hết hạn */ }
    clearSession();
    location.replace('/login.html');
  }

  // Trang yêu cầu đăng nhập với vai trò cho trước
  function requireRole(...roles) {
    const user = getUser();
    if (!getToken() || !user) {
      location.replace(`/login.html?next=${encodeURIComponent(location.pathname + location.search)}`);
      return null;
    }
    if (roles.length && !roles.includes(user.role)) {
      document.querySelector('main').innerHTML =
        '<div class="alert alert-error">Bạn không có quyền truy cập trang này.</div>';
      return null;
    }
    return user;
  }

  // Quay lại bằng nút Back sau khi đăng xuất → tải lại để kiểm tra phiên (AC-02.4)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload();
  });

  function renderPagination(container, pagination, onPage) {
    container.innerHTML = '';
    if (!pagination || pagination.totalPages <= 1) return;
    const { page, totalPages } = pagination;
    const add = (label, target, disabled, current) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn-sm ${current ? 'current' : 'btn-secondary'}`;
      b.textContent = label;
      b.disabled = disabled;
      b.addEventListener('click', () => onPage(target));
      container.appendChild(b);
    };
    add('‹', page - 1, page <= 1);
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let p = start; p <= end; p++) add(String(p), p, false, p === page);
    add('›', page + 1, page >= totalPages);
  }

  document.addEventListener('DOMContentLoaded', renderHeader);

  return {
    ROLE_LABEL,
    STATUS_LABEL,
    HOME_BY_ROLE,
    api,
    getToken,
    getUser,
    setSession,
    clearSession,
    formatMoney,
    formatDate,
    formatDateTime,
    escapeHtml,
    statusBadge,
    coverSrc,
    defaultCover,
    showAlert,
    toast,
    showFieldErrors,
    requireRole,
    renderPagination,
  };
})();
