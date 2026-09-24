# FC 27 — Báo cáo kiểm tra sau ra mắt

Ngày kiểm tra: 24/09/2026.

## Kết quả tự động

- TypeScript: `npx tsc --noEmit` thành công.
- ESLint: toàn bộ file thay đổi của luồng FC 27 thành công.
- Unit tests: 7 file, 78/78 tests thành công.
- Production build: `npm run build` thành công; 125 trang được tạo.
- Các route `/games/fc27`, `/games/fc27/select`, `/games/fc27/payment`, `/games/fc27/download` có trong build.
- Endpoint `/api/download-fc27` có trong build và trả 401 khi chưa xác thực mã.
- Test quyền xác nhận mã FC 26 không mở được FC 27 và mã FC 27 không mở được FC 26.

## Kiểm tra trình duyệt local

- Trang chủ, trang sản phẩm, checkout và trang nhập mã đều trả HTTP 200.
- Desktop 1440px: không có ảnh lỗi, page error hoặc tràn ngang.
- Mobile 390px: không tràn ngang; hero hiển thị trạng thái ra mắt, giá 180.000đ và CTA mua.
- Mỗi màn hình chính có đúng một `h1`.
- Checkout hiển thị sản phẩm EA FC 27 Standard Edition và lấy giá từ cấu hình server.

## Chưa kiểm thử bằng giao dịch thật

- Không tạo link PayOS thật và không chuyển tiền trong quá trình kiểm tra.
- Đã xác nhận object production và tạo được link tải có chữ ký sau khi nhập mã FC 27 hợp lệ.
- Cần hoàn thành checklist production trong `FC27-HOMEPAGE-BLUEPRINT.md`: upload file, kiểm tra webhook, email, mã thật và tải file từ mạng ngoài.

## Kho tải production

- Bucket mặc định: `fc27download`.
- Object key mặc định: `EA SPORTS FC 27.rar`.
- Dung lượng xác nhận: `60.667.256.060 byte` (hiển thị `60.67 GB`).
- Có thể thay bằng `R2_FC27_BUCKET` và `R2_FC27_GAME_KEY` trong môi trường production.
