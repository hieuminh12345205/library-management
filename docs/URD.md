# TÀI LIỆU YÊU CẦU NGƯỜI DÙNG (URD)

**Hệ thống:** Quản lý mượn – trả sách thư viện (LibraryHub)
**Phiên bản:** 1.0 · **Người lập:** Mỵ Hiểu Minh – 23110198 · **Ngày:** 02/10/2026
**Học phần:** Đánh giá hiệu năng – Trường Đại học Việt Nhật

---

## 1. Giới thiệu

### 1.1. Mục đích tài liệu
Tài liệu mô tả nhu cầu của người dùng đối với hệ thống quản lý mượn – trả sách thư viện: ai dùng hệ thống, họ cần làm gì, theo luồng nghiệp vụ nào, và khi nào thì coi một yêu cầu là đạt. Tài liệu là đầu vào cho SRS (đặc tả chi tiết) và là căn cứ nghiệm thu.

### 1.2. Bối cảnh và vấn đề
Thư viện hiện quản lý việc mượn – trả bằng sổ giấy và bảng tính:
- Độc giả phải đến tận nơi mới biết sách còn hay hết.
- Thủ thư tự tra hạn trả, tự tính tiền phạt bằng tay nên dễ sai.
- Không có số liệu về sách được mượn nhiều hay danh sách sách quá hạn.

### 1.3. Mục tiêu nghiệp vụ
| Mã | Mục tiêu | Chỉ số đo |
|---|---|---|
| BG-01 | Độc giả tự tra cứu và gửi yêu cầu mượn trực tuyến | ≥ 80% yêu cầu mượn được tạo qua hệ thống |
| BG-02 | Giảm sai sót khi tính phí phạt | Phí phạt do hệ thống tự tính, 0 thao tác tính tay |
| BG-03 | Thủ thư xử lý yêu cầu nhanh | Duyệt một yêu cầu ≤ 3 thao tác |
| BG-04 | Có số liệu thống kê phục vụ bổ sung sách | Báo cáo sách mượn nhiều, sách quá hạn xem được bất kỳ lúc nào |

### 1.4. Phạm vi
**Trong phạm vi:** tài khoản, tra cứu sách, mượn – gia hạn – trả, duyệt yêu cầu, quản lý đầu sách, quản lý tài khoản, thống kê.
**Ngoài phạm vi:** thanh toán phí phạt trực tuyến, gửi email/SMS, đặt trước sách đã hết, quản lý nhiều chi nhánh, mã vạch/RFID.

### 1.5. Thuật ngữ
| Thuật ngữ | Giải thích |
|---|---|
| Đầu sách | Một tựa sách (một ISBN), có thể có nhiều bản |
| Bản sách | Một cuốn vật lý của đầu sách |
| Phiếu mượn | Bản ghi một lần mượn **một** bản sách của một độc giả |
| Hạn trả | Ngày cuối cùng độc giả phải trả sách |
| Phí phạt | Tiền độc giả phải trả khi trả sách sau hạn |

---

## 2. Người dùng hệ thống

| Mã | Vai trò | Mô tả | Nhu cầu chính |
|---|---|---|---|
| R-00 | Khách | Người chưa đăng nhập | Xem, tìm sách; đăng ký tài khoản |
| R-01 | Độc giả | Sinh viên, giảng viên có tài khoản | Tìm sách, gửi yêu cầu mượn, gia hạn, xem lịch sử mượn |
| R-02 | Thủ thư | Nhân viên thư viện | Duyệt/từ chối yêu cầu, xác nhận trả, quản lý đầu sách, xem thống kê |
| R-03 | Quản trị viên | Người quản lý hệ thống | Quản lý tài khoản (khoá/mở, đổi vai trò), xem thống kê |

> Khách không phải vai trò đăng nhập. Ba vai trò có tài khoản là Độc giả, Thủ thư, Quản trị viên.

---

## 3. Quy tắc nghiệp vụ người dùng đã thống nhất

| Mã | Quy tắc |
|---|---|
| UR-BR-01 | Mỗi độc giả giữ tối đa **5** cuốn cùng lúc (tính cả yêu cầu đang chờ duyệt). |
| UR-BR-02 | Thời hạn mượn là **14 ngày** kể từ ngày thủ thư duyệt. |
| UR-BR-03 | Mỗi phiếu mượn được gia hạn **1 lần**, thêm **7 ngày**, khi chưa quá hạn. |
| UR-BR-04 | Trả sau hạn bị phạt **2.000 đ/ngày**, tối đa **100.000 đ** mỗi phiếu. |
| UR-BR-05 | Độc giả đang có sách quá hạn thì không được mượn thêm. |
| UR-BR-06 | Chỉ cho mượn khi đầu sách còn bản. |
| UR-BR-07 | Tài khoản bị khoá không đăng nhập được. |

---

## 4. Luồng nghiệp vụ

### FLOW-01. Tìm sách → gửi yêu cầu mượn → thủ thư duyệt
1. Độc giả đăng nhập, tìm sách theo tên/tác giả/ISBN.
2. Độc giả mở chi tiết sách, thấy số bản còn lại, bấm **Mượn sách**.
3. Hệ thống kiểm tra quy tắc UR-BR-01, 05, 06; nếu đạt, tạo phiếu ở trạng thái **Chờ duyệt**.
4. Thủ thư mở danh sách yêu cầu chờ duyệt, chọn **Duyệt** → phiếu chuyển **Đang mượn**, có hạn trả; số bản còn lại giảm 1.
5. Độc giả thấy phiếu "Đang mượn" kèm hạn trả trong lịch sử mượn.

*Nhánh khác:* thủ thư **Từ chối** kèm lý do → phiếu **Bị từ chối**. Độc giả không đủ điều kiện ở bước 3 → hệ thống báo lý do cụ thể, không tạo phiếu.

### FLOW-02. Trả sách → tính phí phạt quá hạn
1. Độc giả mang sách đến quầy.
2. Thủ thư tìm phiếu mượn (theo mã phiếu hoặc email độc giả), bấm **Xác nhận trả**.
3. Hệ thống tính số ngày quá hạn và phí phạt, hiển thị cho thủ thư.
4. Phiếu chuyển **Đã trả**; số bản còn lại tăng 1.
5. Độc giả thấy phiếu "Đã trả" và phí phạt trong lịch sử.

### FLOW-03. Thủ thư thêm sách mới → độc giả tìm thấy và mượn được
1. Thủ thư thêm đầu sách mới (ISBN, tên, tác giả, thể loại, số bản…).
2. Đầu sách xuất hiện ngay trong kết quả tìm kiếm.
3. Độc giả tìm thấy và gửi yêu cầu mượn (tiếp FLOW-01 từ bước 2).

---

## 5. User story

Độ ưu tiên theo MoSCoW: **M** – Must (bắt buộc), **S** – Should (nên có), **C** – Could (có thì tốt).

| Mã | User story | Ưu tiên | Luồng |
|---|---|---|---|
| US-01 | Là **khách**, tôi muốn **đăng ký tài khoản bằng email** để **có thể mượn sách trực tuyến**. | M | – |
| US-02 | Là **người dùng có tài khoản**, tôi muốn **đăng nhập và đăng xuất** để **dùng các chức năng theo vai trò và bảo vệ tài khoản**. | M | 01, 02, 03 |
| US-03 | Là **độc giả**, tôi muốn **tìm sách theo tên, tác giả, ISBN và thể loại** để **nhanh chóng biết thư viện có sách tôi cần**. | M | 01, 03 |
| US-04 | Là **độc giả**, tôi muốn **xem chi tiết sách và số bản còn lại** để **quyết định có mượn hay không**. | M | 01, 03 |
| US-05 | Là **độc giả**, tôi muốn **gửi yêu cầu mượn sách** để **không phải xếp hàng tại quầy**. | M | 01, 03 |
| US-06 | Là **độc giả**, tôi muốn **xem lịch sử mượn, hạn trả và phí phạt** để **trả sách đúng hạn**. | M | 01, 02 |
| US-07 | Là **độc giả**, tôi muốn **gia hạn sách đang mượn** để **có thêm thời gian đọc**. | S | – |
| US-08 | Là **thủ thư**, tôi muốn **duyệt hoặc từ chối yêu cầu mượn** để **kiểm soát việc cho mượn**. | M | 01 |
| US-09 | Là **thủ thư**, tôi muốn **xác nhận trả sách và hệ thống tự tính phí phạt** để **không phải tính tay**. | M | 02 |
| US-10 | Là **thủ thư**, tôi muốn **thêm, sửa, xoá đầu sách** để **danh mục luôn đúng với kho**. | M | 03 |
| US-11 | Là **quản trị viên**, tôi muốn **khoá/mở khoá tài khoản và đổi vai trò** để **quản lý ai được dùng hệ thống**. | M | – |
| US-12 | Là **thủ thư hoặc quản trị viên**, tôi muốn **xem thống kê sách mượn nhiều và sách quá hạn** để **lên kế hoạch bổ sung sách và nhắc độc giả**. | S | – |

---

## 6. Tiêu chí nghiệm thu

Viết theo dạng *Cho trước – Khi – Thì*.

**US-01 – Đăng ký**
- AC-01.1: Khi nhập đủ họ tên, email hợp lệ chưa dùng, số điện thoại, mật khẩu hợp lệ và xác nhận khớp, thì tài khoản được tạo với vai trò Độc giả và người dùng được chuyển tới trang đăng nhập.
- AC-01.2: Khi email đã được dùng, thì hệ thống báo "Email đã được sử dụng" và không tạo tài khoản.
- AC-01.3: Khi mật khẩu ngắn hơn 8 ký tự hoặc không có cả chữ và số, thì hệ thống báo lỗi ngay tại ô mật khẩu.

**US-02 – Đăng nhập / đăng xuất**
- AC-02.1: Khi đăng nhập đúng, thì người dùng vào trang chủ đúng vai trò và thấy tên mình ở thanh đầu trang.
- AC-02.2: Khi sai email hoặc mật khẩu, thì hệ thống báo "Email hoặc mật khẩu không đúng" (không nói rõ sai trường nào).
- AC-02.3: Cho trước tài khoản bị khoá, khi đăng nhập, thì hệ thống báo "Tài khoản đã bị khoá".
- AC-02.4: Khi bấm Đăng xuất, thì quay về trang đăng nhập và không truy cập lại được trang cần đăng nhập bằng nút Back.

**US-03 – Tìm sách**
- AC-03.1: Khi nhập một phần tên sách (không phân biệt hoa thường, có dấu), thì danh sách hiện các sách có tên chứa từ khoá.
- AC-03.2: Khi không có kết quả, thì hiển thị "Không tìm thấy sách phù hợp".
- AC-03.3: Kết quả được phân trang, mỗi trang mặc định 10 sách.

**US-04 – Chi tiết sách**
- AC-04.1: Trang chi tiết hiển thị ảnh bìa, tên, tác giả, ISBN, thể loại, nhà xuất bản, năm, mô tả và "Còn X/Y bản".
- AC-04.2: Khi sách đã hết bản, thì nút Mượn sách bị vô hiệu và hiện "Hết sách".

**US-05 – Gửi yêu cầu mượn**
- AC-05.1: Cho trước độc giả đủ điều kiện, khi bấm Mượn sách, thì có thông báo thành công và phiếu "Chờ duyệt" xuất hiện trong lịch sử.
- AC-05.2: Cho trước độc giả đã giữ 5 cuốn, khi mượn tiếp, thì bị từ chối với thông báo "Bạn đã mượn tối đa 5 cuốn".
- AC-05.3: Cho trước độc giả có sách quá hạn, khi mượn, thì bị từ chối với thông báo yêu cầu trả sách quá hạn trước.
- AC-05.4: Độc giả không thể gửi hai yêu cầu cho cùng một đầu sách khi yêu cầu trước chưa kết thúc.

**US-06 – Lịch sử mượn**
- AC-06.1: Danh sách hiển thị mã phiếu, tên sách, ngày yêu cầu, hạn trả, trạng thái, phí phạt; mới nhất ở đầu.
- AC-06.2: Lọc được theo trạng thái.
- AC-06.3: Độc giả chỉ thấy phiếu của chính mình.

**US-07 – Gia hạn**
- AC-07.1: Cho trước phiếu Đang mượn chưa gia hạn, khi bấm Gia hạn, thì hạn trả lùi thêm 7 ngày.
- AC-07.2: Phiếu đã gia hạn một lần hoặc đang quá hạn thì không gia hạn được, có thông báo lý do.

**US-08 – Duyệt / từ chối**
- AC-08.1: Khi duyệt, phiếu chuyển Đang mượn, hạn trả = ngày duyệt + 14 ngày, số bản còn giảm 1.
- AC-08.2: Khi từ chối, bắt buộc nhập lý do; phiếu chuyển Bị từ chối; độc giả thấy lý do.
- AC-08.3: Khi đầu sách đã hết bản lúc duyệt, thì không duyệt được và có thông báo.

**US-09 – Xác nhận trả**
- AC-09.1: Trả đúng hoặc trước hạn thì phí phạt 0 đ.
- AC-09.2: Trả trễ N ngày thì phí phạt = N × 2.000 đ, tối đa 100.000 đ.
- AC-09.3: Sau khi trả, số bản còn tăng 1, phiếu chuyển Đã trả.

**US-10 – Quản lý đầu sách**
- AC-10.1: Thêm sách với ISBN trùng thì bị từ chối.
- AC-10.2: Không xoá được đầu sách đang có người mượn hoặc chờ duyệt.
- AC-10.3: Sách mới thêm xuất hiện ngay trong tìm kiếm.

**US-11 – Quản lý tài khoản**
- AC-11.1: Tài khoản bị khoá không đăng nhập được và phiên đang mở bị vô hiệu ở lần gọi kế tiếp.
- AC-11.2: Quản trị viên không thể tự khoá hoặc tự đổi vai trò của chính mình.

**US-12 – Thống kê**
- AC-12.1: Hiển thị tối đa 10 sách được mượn nhiều nhất trong khoảng thời gian chọn.
- AC-12.2: Hiển thị danh sách phiếu đang quá hạn, số ngày quá hạn và phí phạt tạm tính.

---

## 7. Yêu cầu chất lượng mong muốn (mức người dùng)
| Mã | Mong muốn |
|---|---|
| UQ-01 | Tìm kiếm phản hồi gần như tức thì, kể cả giờ cao điểm (khoảng 50 người dùng cùng lúc). |
| UQ-02 | Gửi yêu cầu mượn không phải chờ quá lâu. |
| UQ-03 | Dùng được trên điện thoại và máy tính. |
| UQ-04 | Giao diện tiếng Việt, tiền hiển thị dạng "2.000 đ", ngày dạng dd/mm/yyyy. |
| UQ-05 | Mật khẩu được bảo vệ, người dùng không xem được dữ liệu của người khác. |
| UQ-06 | Hệ thống hoạt động liên tục trong học kỳ. |

---

## 8. Ràng buộc và giả định
- Ứng dụng web, truy cập qua trình duyệt; có API JSON phục vụ giao diện và kiểm thử.
- Ngày giờ theo múi giờ Việt Nam (UTC+7).
- Dữ liệu mẫu: ≥ 50 đầu sách, ≥ 10 độc giả, có sẵn phiếu ở mọi trạng thái.
- Phí phạt được thu tại quầy, hệ thống chỉ ghi nhận số tiền.

## 9. Truy vết URD → SRS
| User story | Chức năng SRS | Luồng |
|---|---|---|
| US-01 | FR-01 | – |
| US-02 | FR-02 | FLOW-01, 02, 03 |
| US-03 | FR-03 | FLOW-01, 03 |
| US-04 | FR-04 | FLOW-01, 03 |
| US-05 | FR-05 | FLOW-01, 03 |
| US-06 | FR-06 | FLOW-01, 02 |
| US-07 | FR-07 | – |
| US-08 | FR-08 | FLOW-01 |
| US-09 | FR-09 | FLOW-02 |
| US-10 | FR-10 | FLOW-03 |
| US-11 | FR-11 | – |
| US-12 | FR-12 | – |
| UQ-01, UQ-02 | NFR-01 → NFR-05 | – |
| UQ-03 | NFR-09, NFR-10 | – |
| UQ-04 | NFR-11 | – |
| UQ-05 | NFR-06, NFR-07 | – |
| UQ-06 | NFR-08 | – |
