# Blueprint — EA FC 27 sau ra mắt

Cập nhật: 24/09/2026. Trạng thái: đã triển khai local, chưa tạo giao dịch thật và chưa push trong lần cập nhật này.

## 1. Trạng thái sản phẩm

- EA FC 27 đã chính thức ra mắt.
- Một sản phẩm đang bán: `fc27-standard` — EA FC 27 Launch Edition.
- Giá chuẩn phía server: `180000` VND trong `lib/payment/config.ts`.
- Hình thức nhận: PayOS xác nhận thanh toán → tạo mã `FC27-XXXX-XXXX` → gửi email → khách nhập mã để mở khu tải.
- FC 26 và thư viện mod hiện tại tiếp tục hoạt động độc lập.

## 2. Hành trình mua

1. Trang chủ và navbar dẫn tới `/games/fc27/select`.
2. Trang sản phẩm hiển thị giá, nội dung gói và quy trình nhận game.
3. `/games/fc27/payment` dùng component checkout chung và tạo đơn qua `/api/payment/create`.
4. Giá và tên sản phẩm được lấy từ cấu hình server, không nhận từ trình duyệt.
5. PayOS trả về `/payment/success`; trang kết quả poll trạng thái đơn.
6. Webhook đã xác thực chữ ký tạo mã riêng cho `fc27-standard` và gửi email.
7. Khách nhập mã tại `/games/fc27`; mã đúng tạo cookie HTTP-only một giờ.
8. `/api/download-fc27` kiểm tra cookie và record mã trong Redis trước khi cấp presigned URL R2.

## 3. R2 placeholder

Endpoint tải FC 27 hỗ trợ hai biến môi trường:

| Biến               | Mặc định       | Ý nghĩa                  |
| ------------------ | -------------- | ------------------------ |
| `R2_FC27_BUCKET`   | `fc27download` | Bucket chứa bộ cài FC 27 |
| `R2_FC27_GAME_KEY` | `FC27.rar`     | Object key của bộ cài    |

Cách nhanh nhất: tạo bucket `fc27download` và upload file với key `FC27.rar`. Nếu muốn tên khác, cấu hình hai biến trên rồi redeploy. Endpoint dùng chung credentials `R2_ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` đang có.

Link được ký trong một giờ. Khi object chưa được upload, hệ thống vẫn có thể tạo URL ký nhưng R2 sẽ trả lỗi lúc tải; giao diện đã ghi rõ đây là vị trí placeholder.

## 4. Tách quyền FC 26 / FC 27

Record code mới có cả `type` và `productId`. Mã FC 27 chỉ mở endpoint FC 27 khi `productId === "fc27-standard"`.

Mã FC 26 cũ không có `productId` vẫn dùng được theo prefix/type để tránh làm mất quyền của khách cũ. Mã FC 27 không được chấp nhận ở trang FC 26, kể cả khi người dùng mở FC 26 không kèm query edition.

## 5. Kiến trúc trang

| Route                  | Vai trò                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `/`                    | Hero ra mắt, giá 180.000đ, CTA mua, FC 26, mods, bài viết và FAQ |
| `/games/fc27/select`   | Landing sản phẩm và nội dung gói                                 |
| `/games/fc27/payment`  | Checkout PayOS và chuyển khoản thủ công                          |
| `/games/fc27`          | Nhập mã và khu tải sau xác thực                                  |
| `/games/fc27/download` | Trung tâm tải dự phòng cho phiên đã xác thực                     |
| `/api/download-fc27`   | Cấp presigned URL R2 sau khi kiểm tra quyền                      |

## 6. Nguồn sự thật

- Sản phẩm, giá, đường dẫn nhận nội dung: `lib/payment/config.ts`.
- Mã truy cập và product binding: `lib/server/gen-code.ts`.
- Webhook cấp mã: `app/api/payment/webhook/route.ts`.
- Xác thực mã và cookie: `app/api/verify-code/route.ts`.
- Bucket/key FC 27: `app/api/download-fc27/route.ts`.
- Danh sách file hiển thị: `app/data/games.ts`.
- Nội dung chiến dịch: `app/page.tsx`.

Không lặp giá 180.000đ trong logic thanh toán phía client. Copy marketing có thể hiển thị giá, nhưng PayOS luôn lấy `product.price` ở server.

## 7. Checklist trước khi đưa khách tải

- [ ] Tạo bucket hoặc cấu hình `R2_FC27_BUCKET`.
- [ ] Upload object hoặc cấu hình `R2_FC27_GAME_KEY`.
- [ ] Kiểm tra credentials R2 production có quyền `GetObject`.
- [ ] Tạo một giao dịch PayOS test hợp lệ với email kiểm thử.
- [ ] Xác nhận webhook chuyển đơn thành `COMPLETED` hoặc `CODE_GENERATED`.
- [ ] Xác nhận email có mã prefix `FC27`.
- [ ] Nhập mã và tải thử toàn bộ file từ mạng ngoài.
- [ ] Kiểm tra dung lượng/hash file rồi bổ sung `fileSize` vào `app/data/games.ts`.
- [ ] Thay video/hướng dẫn cài đặt nếu FC 27 cần quy trình khác FC 26.
- [ ] Sau khi nghiệm thu mới thông báo rộng rãi cho khách.

## 8. Tiêu chí nghiệm thu kỹ thuật

- Homepage và bốn route FC 27 render không lỗi ở desktop/mobile.
- Giá checkout là 180.000đ từ server.
- Mã FC 26 không mở được download FC 27; mã FC 27 không mở được FC 26.
- Endpoint tải FC 27 trả 401 khi chưa có cookie, 403 khi mã hết hạn/sai sản phẩm.
- Không có tràn ngang, ảnh lỗi hoặc JavaScript page error.
- TypeScript, ESLint, unit tests và production build đều thành công.
