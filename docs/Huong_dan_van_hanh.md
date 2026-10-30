# HƯỚNG DẪN VẬN HÀNH VÀ BÀN GIAO LIBRARYHUB

**Phiên bản:** 2.2 · **Ngày:** 30/10/2026 · **Chủ hệ thống:** Mỵ Hiểu Minh – MSSV 23110198

Tài liệu hướng dẫn chạy LibraryHub trên máy cá nhân và trên VPS, tạo dữ liệu mẫu, kiểm tra kết nối và chuẩn bị thông tin để bàn giao hệ thống cho tester.

## 1. Thành phần hệ thống

- Backend: Node.js 20 trở lên, Express 5; khuyến nghị Node.js 22 để thống nhất với Dockerfile.
- Database: PostgreSQL 16. Dự án chưa hỗ trợ MySQL; máy có MySQL có thể chạy thêm PostgreSQL hoặc dùng Docker.
- Frontend: HTML/CSS/JavaScript được Express phục vụ cùng ứng dụng; không có bước build frontend riêng.
- Tài liệu căn cứ: URD v2.1, SRS v2.1, Tài liệu API v2.1.

## 2. Chạy trực tiếp trên Windows

Chuẩn bị Node.js và PostgreSQL. Tạo database library và tài khoản có quyền tạo bảng trong database đó, sau đó mở PowerShell tại thư mục dự án:

```powershell
npm ci
Copy-Item .env.example .env
```

Sửa .env cho đúng thông tin PostgreSQL của máy:

```text
PORT=3000
DATABASE_URL=postgres://library:library@localhost:5432/library
JWT_SECRET=THAY_BANG_CHUOI_NGAU_NHIEN_DAI
```

Giá trị library/library chỉ là ví dụ cho môi trường local. Không đưa .env lên GitHub. Tạo dữ liệu mẫu lần đầu và khởi động:

```powershell
npm run seed
npm start
```

Mở http://localhost:3000. Server tạo bảng nếu chưa tồn tại trước khi bắt đầu phục vụ.

## 3. Chạy bằng Docker Compose

Cài và khởi động Docker Desktop, tạo .env từ .env.example và đặt JWT_SECRET riêng, rồi chạy:

```powershell
docker compose up -d --build
docker compose logs --tail 50 app
docker compose exec app npm run seed
```

Ứng dụng dùng cổng 3000. PostgreSQL trong container dùng cổng 5432; cổng kết nối từ máy host là 5433. Compose cung cấp DATABASE_URL nội bộ cho app, vì vậy không dùng localhost để app kết nối container db.

Nếu app khởi động trước khi database sẵn sàng, đợi db sẵn sàng và chạy docker compose restart app. Dừng bằng docker compose stop. Lệnh docker compose down -v xóa volume database và không dùng trong giai đoạn tester cần giữ dữ liệu.

## 4. Triển khai trên VPS

Bản bàn giao chạy tại **https://sv24.bcse-vju.com** (VPS Ubuntu 24.04, lab BCSE – VJU). Luồng truy cập: Cloudflare (HTTPS) → Nginx cổng 80 → app tại 127.0.0.1:3000 → PostgreSQL trong mạng nội bộ Docker. Database không mở cổng ra ngoài.

Cài lần đầu trong thư mục ~/projects/library-management (đã clone repo, máy có Docker và Nginx):

```bash
umask 077
printf 'POSTGRES_PASSWORD=%s
JWT_SECRET=%s
' "$(openssl rand -hex 24)" "$(openssl rand -hex 32)" > .env.prod
sudo docker compose --env-file .env.prod -f compose.prod.yml up -d --build
sudo docker compose --env-file .env.prod -f compose.prod.yml exec app npm run seed
sudo cp deploy/nginx-libraryhub.conf /etc/nginx/sites-available/libraryhub
sudo ln -sf /etc/nginx/sites-available/libraryhub /etc/nginx/sites-enabled/libraryhub
sudo nginx -t && sudo systemctl reload nginx
```

File .env.prod chứa mật khẩu database và JWT secret sinh ngẫu nhiên, chỉ nằm trên VPS, không đưa lên GitHub. Không tạo lại file này khi đã có dữ liệu, vì mật khẩu mới sẽ không khớp database hiện có.

Các lệnh vận hành thường dùng (chạy trong thư mục dự án):

| Việc | Lệnh |
|---|---|
| Xem trạng thái | `sudo docker compose --env-file .env.prod -f compose.prod.yml ps` |
| Xem log app | `sudo docker compose --env-file .env.prod -f compose.prod.yml logs --tail 50 app` |
| Cập nhật mã nguồn | `git pull` rồi chạy lại lệnh `up -d --build` |
| Tạm dừng / chạy lại | `... stop` / `... start` |
| Kiểm tra từ ngoài | `curl https://sv24.bcse-vju.com/api/health` |

Container đặt restart: unless-stopped nên tự chạy lại khi VPS khởi động lại. Mọi lần cập nhật mã nguồn, reset dữ liệu hoặc dừng dịch vụ đều được ghi lại và báo cho tester.

## 5. Tài khoản mẫu

Mật khẩu chung của bộ seed: Test@123.

| Vai trò | Email | Mục đích |
|---|---|---|
| Quản trị viên | admin01@library.test | Khoá / mở khoá tài khoản, xem thống kê |
| Thủ thư | librarian01@library.test | Duyệt, trả sách, quản lý đầu sách |
| Độc giả | reader01@library.test | Có phiếu ở đủ 5 trạng thái |
| Độc giả | reader02@library.test | Có 5 phiếu hoạt động |
| Độc giả | reader03@library.test | Có sách quá hạn (một phiếu quá hạn lâu); giữ bản duy nhất của một đầu sách |
| Độc giả bị khóa | locked01@library.test | Kiểm tra chặn đăng nhập |

Seed tạo 6 tài khoản, 60 đầu sách và 45 phiếu. Ngày và mã phiếu được tạo tương đối theo ngày chạy; không dựa vào mã phiếu cố định trong ví dụ để chọn dữ liệu. Xác định phiếu theo email, tên sách và trạng thái.

## 6. Kiểm tra sau khi chạy

1. GET /api/health trả 200 và data.status = ok; endpoint này kiểm tra HTTP, không kiểm tra kết nối database.
2. GET /api/categories trả 8 thể loại; GET /api/books trả danh sách và pagination.
3. Đăng nhập thử lần lượt độc giả, thủ thư, quản trị viên; kiểm tra menu và quyền qua API.
4. Kiểm tra các trang: /, /book.html?id=1, /history.html, /librarian/, /librarian/loans.html, /librarian/books.html, /admin/, /stats.html.
5. Trước khi ký bàn giao, kiểm tra một luồng mượn và trả trên dữ liệu riêng, lưu bằng chứng và mã commit triển khai.

## 7. Sao lưu và khôi phục dữ liệu

Dữ liệu PostgreSQL không nằm trong mã nguồn Git. Muốn giữ các thao tác đã thực hiện, sao lưu database bằng công cụ PostgreSQL trước khi chuyển máy. Muốn bắt đầu với bộ mẫu đi kèm, dùng npm run seed trên database trống.

Lệnh npm run seed không ghi đè database đã có tài khoản. Chỉ khi chủ hệ thống và tester đã thống nhất reset, sao lưu bằng chứng rồi mới dùng:

```powershell
npm run seed -- --force
```

Lệnh này xóa toàn bộ người dùng, sách, phiếu, bộ đếm và token đã thu hồi để tạo lại bộ mẫu. Không chạy tự động ở mỗi lần khởi động hoặc deploy.

## 8. Thông tin triển khai

| Hạng mục | Giá trị |
|---|---|
| Link sản phẩm | https://sv24.bcse-vju.com |
| Base URL API | https://sv24.bcse-vju.com/api |
| Server | VPS Ubuntu 24.04.5 LTS, 2 vCPU, 2 GB RAM, 20 GB SSD |
| Phần mềm | Docker 29.9, Nginx 1.24, Node.js 22 (image node:22-alpine), PostgreSQL 16 (image postgres:16-alpine) |
| Ngày triển khai | 30/10/2026 |
| Mã commit mã nguồn | dba26a8 |
| Bạn cặp và ngày bàn giao | Bổ sung khi hai bên xác nhận |

Ứng dụng đọc PORT, DATABASE_URL và JWT_SECRET từ biến môi trường; bản deploy dùng mật khẩu database và JWT secret riêng, không dùng giá trị ví dụ local. Cấu hình CPU/RAM trên là môi trường dùng để đo hiệu năng.

## 9. Phạm vi và hỗ trợ bàn giao

Hệ thống quản lý một thư viện, số lượng theo đầu sách; không quản lý mã vạch từng bản, nhiều chi nhánh, email/SMS, đặt trước sách hết bản hoặc thanh toán trực tuyến. Phí được hiển thị để xử lý tại quầy, không có nghiệp vụ xác nhận thanh toán.

Sau khi bàn giao, giữ phiên bản sản phẩm theo quy định học phần và phản hồi bug report trong 48 giờ. Mọi thay đổi môi trường hoặc reset dữ liệu cần được ghi nhận. Kết quả kiểm thử hiệu năng và uptime được lập từ phép đo thực tế.
