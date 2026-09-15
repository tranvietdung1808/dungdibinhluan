# FC 27 — Báo cáo kiểm tra local

Ngày: 15/09/2026.

## Kết quả

- TypeScript: npx tsc --noEmit thành công. Lần đầu vướng generated types của route players cũ; npx next typegen tạo lại route types và giải quyết lỗi.
- ESLint: app/page.tsx và app/components/Navbar.tsx qua kiểm tra.
- Unit tests hiện có: 3 file, 12/12 tests thành công. Không thêm test chỉ lặp lại markup.
- Production build: npm run build thành công; 120 trang được tạo; homepage có revalidate 1 giờ.
- Browser Chromium headless, dữ liệu local thật: không ghi nhận pageerror; không có ảnh lỗi sau khi cuộn tải tất cả ảnh.
- Độ rộng 320, 390, 768, 1024, 1440px: scrollWidth bằng viewport, một h1, giá hiện diện, anchor nội bộ tồn tại.
- Mobile menu: mở có aria-expanded=true, chọn FC 26 đóng menu và đến #fc26.
- FAQ: focus summary và Enter mở nội dung.
- Hai CTA liên hệ đặt trước trỏ đúng Facebook của cửa hàng. Không gửi tin nhắn hoặc thanh toán.
- Đã xem ảnh chụp desktop toàn trang và mobile; tinh chỉnh crop khu đặt trước, khoảng cách navbar, font hero/CTA ở 320px.

## Tối ưu ảnh

Bốn ảnh gốc tổng 1.787.796 bytes; bốn WebP tổng 344.712 bytes, giảm khoảng 80.7%. Thư mục fc27pic giữ nguyên; public chỉ giữ bản WebP phục vụ trang.

## Giới hạn

- Chưa deploy website hoặc commit git.
- Chưa xây checkout FC 27; dùng luồng liên hệ đặt trước. Không kiểm thử giao dịch tiền thật.
- Browser kiểm tra ở trạng thái chưa đăng nhập; không thao tác tài khoản/đơn hàng người dùng.
- Token toàn cục ảnh hưởng các màn hình đang dùng semantic tokens; không thực hiện visual regression đầy đủ mọi trang account/admin.
- Ảnh edition là minh họa, không xác minh thông tin phát hành hay quyền lợi edition qua nguồn chính thức trong task này.

## Xem kết quả

- Local preview: http://localhost:5000
- fc27-desktop-preview.png
- fc27-mobile-preview.png
- FC27-HOMEPAGE-BLUEPRINT.md
- NGON-NGU-THIET-KE.md
