# LibraryHub – Hệ thống quản lý mượn – trả sách thư viện

Bài tập lớn môn **Đánh giá hiệu năng hệ thống** – Trường Đại học Việt Nhật.

- Sinh viên: Mỵ Hiểu Minh – MSSV 23110198
- Tài liệu: [URD](docs/URD.md) · [SRS](docs/SRS.md) · [Tài liệu API (Mẫu 01)](docs/Mau_01_Tai_lieu_API.docx)

## Công nghệ

- Backend: Node.js 20+ · Express 5 · PostgreSQL 16
- Frontend: HTML/CSS/JavaScript thuần, gọi JSON API (`/api/...`)
- Xác thực: JWT (Bearer token, hết hạn sau 60 phút)

## Chạy trên máy

Yêu cầu: Node.js ≥ 20 và PostgreSQL 16 có database `library` (user/mật khẩu `library`).

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

Mở <http://localhost:3000>. Bảng dữ liệu được tạo tự động khi server khởi động.

`npm run seed` từ chối chạy nếu DB đã có dữ liệu; dùng `npm run seed -- --force` để xoá sạch và tạo lại dữ liệu mẫu.

## Chạy bằng Docker

```bash
docker compose up -d --build
docker compose exec app npm run seed
```

## Tài khoản mẫu

Mật khẩu chung: `Test@123`

| Email | Vai trò | Ghi chú |
|---|---|---|
| admin01@library.test, admin02@library.test | Quản trị viên | |
| librarian01@library.test, librarian02@library.test | Thủ thư | |
| reader01@library.test | Độc giả | Có phiếu ở đủ các trạng thái |
| reader02@library.test | Độc giả | Đã đạt giới hạn 5 phiếu |
| reader03@library.test | Độc giả | Có phiếu quá hạn |
| reader04@library.test | Độc giả | Chưa có phiếu nào |
| reader05@library.test | Độc giả | Quá hạn ~60 ngày (phí phạt chạm trần) |
| reader06@library.test | Độc giả | Đang giữ bản duy nhất của một đầu sách |
| reader07 – reader12@library.test | Độc giả | Dữ liệu bổ sung |
| locked01@library.test | Độc giả | Tài khoản bị khoá |

## Các trang

| Đường dẫn | Vai trò | Chức năng |
|---|---|---|
| `/` | Mọi người | Tìm kiếm sách |
| `/book.html?id=` | Mọi người | Chi tiết sách, gửi yêu cầu mượn |
| `/register.html`, `/login.html` | Khách | Đăng ký, đăng nhập |
| `/history.html` | Độc giả | Lịch sử mượn, gia hạn |
| `/librarian/` | Thủ thư | Duyệt / từ chối yêu cầu |
| `/librarian/loans.html` | Thủ thư | Tra cứu phiếu, xác nhận trả |
| `/librarian/books.html` | Thủ thư | Thêm / sửa / xoá sách |
| `/admin/` | Quản trị viên | Khoá / mở khoá, đổi vai trò tài khoản |
| `/stats.html` | Thủ thư, Quản trị viên | Thống kê |

## Cấu trúc thư mục

```
db/        schema.sql, seed.js
docs/      URD, SRS, tài liệu API
public/    giao diện (HTML/CSS/JS)
src/       server Express: routes, middleware, services, utils
```
