# Blueprint — Trang chủ FC 27 / DungDiBinhLuan

Ngày: 15/09/2026. Trạng thái: đã triển khai giao diện local; chưa publish.

## 1. Mục tiêu và phạm vi

Ưu tiên FC 27 cho giai đoạn chuẩn bị ra mắt: giá đặt trước 180.000đ, thông điệp “Chơi ngay khi game ra mắt”. Giữ hành trình FC 26, mods, hướng dẫn, đăng nhập và liên hệ. Giữ tinh thần palette ảnh tham chiếu: nền gần đen, coral trầm, điểm nhấn ấm tiết chế.

Đầu ra đã tạo: homepage mới, CSS responsive, menu, bộ ảnh WebP, metadata, design language và tài liệu này. Không thay đổi API thanh toán, giá FC 26, tài khoản hay database.

## 2. Kiểm toán trước khi sửa

- Có nhiều chỉnh sửa chưa commit, bao gồm globals.css, page.tsx, Navbar và các trang account/admin. Không reset các thay đổi có sẵn.
- globals.css có palette đỏ–nâu đã lưu; DESIGN.md và tài liệu tiếng Việt lại ghi palette xanh đen. Chênh lệch đã được xử lý bằng primitive dùng chung.
- Trang chủ cũ dùng literal xanh #6ef2a0 ở nhiều khối, không theo accent coral trong ảnh.
- Root layout và trang chủ cùng cộng chiều cao navbar, gây khoảng trống thừa. Trang chủ mới dùng padding từ layout.
- Trang chủ trước đây có banner Autumn Sale và hero FC 26; thay bằng campaign FC 27. Các file hero/banner cũ được giữ để không phá tham chiếu khác.
- Không thấy checkout FC 27 trong cấu trúc hiện tại. Luồng đặt trước hiện dùng trang Facebook đang có của cửa hàng.

## 3. Kiến trúc thông tin

| Thứ tự | Khối | Nội dung | Hành động |
| --- | --- | --- | --- |
| 0 | Navbar | Logo, FC 27, FC 26, Mods, game, hướng dẫn, cộng đồng, tài khoản | FC 27 → /#dat-truoc; FC 26 → /#fc26 |
| 1 | Announcement | Mùa giải mới, giá 180.000đ | Cuộn tới khu đặt |
| 2 | Hero | EA FC 27; Mùa giải mới. Đam mê tiếp nối.; ảnh dọc | Đặt trước → #dat-truoc |
| 3 | Thanh điều hướng mùa giải | FC 27 đặt trước, FC 26 có sẵn, thư viện mods | Anchor / route tương ứng |
| 4 | Đặt trước | Ảnh thành phố + giá + quy trình | Liên hệ đặt trước → Facebook |
| 5 | Ba bước | Chọn mùa giải → xác nhận gói → nhận game khi ra mắt | Giải thích quy trình |
| 6 | FC 26 | Banner, Career Mode, chọn phiên bản | /games/fc26/select và /mods |
| 7 | Mods mới | 4 bản mod thực từ nguồn hiện tại | /mods/[slug] |
| 8 | Bài viết | 4 bài mới, chiến thuật và hướng dẫn | /huong-dan/[slug] |
| 9 | Game khác | FC 25, Black Myth từ danh mục hiện có | Link liên hệ của game |
| 10 | FAQ | Giá, thời điểm chơi, phiên bản, FC 26, tương thích mods | Accordion native |
| 11 | CTA cuối | Nhắc FC 27 và 180.000đ | Facebook |
| 12 | Footer | Thương hiệu, mods, hướng dẫn, liên hệ, DMCA | Link thật |

## 4. Wireframe responsive

### Desktop ≥1280px

Navbar đầy đủ → strip 42px → hero hai vùng (chữ trái, cầu thủ phải) → thanh mùa giải 3 ô → đặt trước 60/40 → FC 26 banner → mods 4 cột → bài viết 2 cột → game 2 cột → FAQ 2 cột → CTA cuối.

Container 1200px; mỗi section khoảng 64px; nội dung canh cùng một trục. Tránh cả trang chỉ có các card giống hệt nhau: phối banner lớn, hàng bài viết, grid và vùng chữ mở.

### Tablet 601–1279px

Menu thu gọn; mods 2 cột. Dưới 800px, khu đặt trước/bài viết/FAQ xếp dọc. FC 26 giữ banner và nút riêng. Không ép menu desktop vào chiều rộng nhỏ.

### Mobile ≤600px

Lề 20px. Hero có ảnh nền và gradient; giá cùng CTA ở hàng rõ ràng. Đặt trước xếp ảnh trên, thông tin dưới; quy trình thành 3 hàng; mods một cột; FAQ và CTA cuối full width. Không dùng thanh CTA cố định mới vì đã có nút Messenger nổi.

## 5. Asset map

| Ảnh nguồn fc27pic | Asset public | Sử dụng |
| --- | --- | --- |
| 1afbfc7ac6475a94d0e6aa302302b7e4fdefbf0a28ee1fa6.jpg | /games/fc27/fc27-portrait.webp | Hero |
| 9c0bf199f3618ac6c79c6cdff06d3662a7d89d46621e5ef05c100891e95a4a97.jpg | /games/fc27/fc27-city.webp | Khu đặt trước và ảnh chia sẻ |
| ea-fc-27.jpg | /games/fc27/fc27-cover.webp | Vùng bài viết |
| fc-27-featured.jpg | /games/fc27/fc27-logo.webp | FAQ |

Giữ nguyên thư mục ảnh nguồn. Asset phục vụ web được nén WebP; hero 1000px chiều rộng, logo 500px, ảnh ngang tối đa 1400px, không upscale. Dùng next/image với kích thước/sizes cụ thể. Dự án hiện đặt images.unoptimized=true nên nén sẵn để giảm tải là cần thiết. Chỉ hero có priority, các ảnh dưới tải lazy.

Ảnh chứa nhãn Standard/Ultimate không xác định edition được bán. Phần FAQ nói rõ ảnh là minh họa. Cần xác nhận quyền lợi gói qua liên hệ.

## 6. Luồng đặt trước hiện tại

1. Khách đọc hero và giá.
2. “Đặt trước FC 27” cuộn xuống #dat-truoc để xem nội dung đầy đủ.
3. “Liên hệ đặt trước” mở https://web.facebook.com/dungbinhluan/ trong tab mới.
4. Cửa hàng xác nhận phiên bản, hình thức kích hoạt, chế độ chơi, cấu hình, thời điểm nhận và chính sách giao dịch trực tiếp.
5. Đơn được xử lý qua kênh liên hệ hiện tại. Không tạo đơn trong database hoặc gọi PayOS ở trang chủ mới.

Không có giao dịch thử hoặc tin nhắn được gửi trong quá trình kiểm thử. Nút dẫn ra Facebook không có nghĩa website đã tạo đơn.

## 7. File map để tiếp tục triển khai

| File | Trách nhiệm |
| --- | --- |
| app/page.tsx | Data fetching server, nội dung, PREORDER_PRICE, link liên hệ, metadata |
| app/home.module.css | Bố cục, responsive, các trạng thái homepage |
| app/globals.css | Primitive màu và alias CSS/Tailwind |
| app/components/Navbar.tsx | Menu mùa giải, login, account, admin, ví và uy tín |
| public/games/fc27/* | Asset đã tối ưu |
| NGON-NGU-THIET-KE.md | Quy chuẩn thiết kế đầy đủ |
| DESIGN.md | Điểm vào tài liệu thiết kế |

PREORDER_PRICE = 180000 là nguồn giá hiển thị trong hero/card/quy trình/CTA cuối; metadata và FAQ có chuỗi giá cần đồng bộ nếu thay giá sau này. Các route FC 26 giữ nguyên. Dữ liệu mods/bài viết đọc từ Supabase; mods có nguồn tĩnh dự phòng, bỏ trùng slug và ưu tiên bản database; revalidate 1 giờ.

## 8. Copy được duyệt theo yêu cầu

- Tên: EA FC 27.
- Nhãn: Đang nhận đặt trước.
- Giá: 180.000đ.
- Hero: Mùa giải mới. Đam mê tiếp nối.
- Cam kết hiển thị theo yêu cầu chủ website: Chơi ngay khi game ra mắt.
- CTA tại hero: Đặt trước FC 27.
- CTA chuyển kênh: Liên hệ đặt trước.
- FC 26: Sân cỏ vẫn đang chờ bạn.

Không thêm ngày ra mắt cụ thể, giá gạch ngang, số lượng sắp hết, bộ đếm, rating hoặc đơn hàng giả. Không gắn mods FC 26 thành mods FC 27. Chưa có xác nhận thông tin phát hành/edition từ bên phát hành trong phạm vi công việc này.

## 9. Kế hoạch chuyển sang checkout FC 27 — chưa triển khai

Nếu muốn nhận thanh toán ngay trên web:

1. Chốt SKU/edition, offline/online, quyền lợi, cách giao, thời điểm chơi, hoàn tiền và bảo hành.
2. Thêm sản phẩm FC 27 riêng trong nguồn dữ liệu sản phẩm phía server. Server định giá 180000; không tin giá gửi từ client.
3. Tạo route /games/fc27 và trang xác nhận đặt trước; không dùng route hoặc product ID FC 26.
4. Tích hợp API tạo đơn hiện có sau khi đọc và kiểm tra contract; thêm trạng thái preorder_pending, paid, awaiting_release, delivered, cancelled/refunded phù hợp schema thực.
5. Webhook idempotent: một khoản thanh toán chỉ được ghi nhận một lần; map đúng sản phẩm; đối chiếu tiền và mã đơn.
6. Tài khoản hiển thị FC 27 đang chờ phát hành, không đưa link download FC 26 cho đơn FC 27.
7. Kiểm thử sandbox thanh toán thành công, thất bại, hủy, webhook lặp, số tiền sai và quyền truy cập trước/sau giao game.
8. Sau khi kiểm thử hoàn tất mới đổi CTA từ Facebook sang checkout. Giữ liên hệ làm phương án hỗ trợ.

## 10. Checklist ngày ra mắt

- [ ] Chủ website xác nhận game và gói thực sự mở chơi được.
- [ ] Xác nhận edition, cấu hình, hướng dẫn nhận và kênh hỗ trợ.
- [ ] Thay nhãn đặt trước bằng đã ra mắt trên strip/hero/card/FAQ/metadata.
- [ ] Đổi “Chơi ngay khi game ra mắt” thành thông điệp chơi ngay khi dịch vụ đã sẵn sàng.
- [ ] Duy trì giá hoặc cập nhật nguồn giá, metadata và FAQ cùng lúc.
- [ ] Đổi CTA đến trang mua/nhận game phù hợp sau khi checkout đã kiểm thử.
- [ ] Bổ sung mod FC 27 chỉ khi đã xác nhận tương thích.
- [ ] Kiểm tra sitemap, ảnh chia sẻ và link chiến dịch sau khi thêm trang FC 27.
- [ ] Triển khai qua luồng hosting của dự án; kiểm tra production và có commit rollback rõ ràng.

## 11. Tiêu chí nghiệm thu

- FC 27 và giá 180.000đ xuất hiện ở màn hình mở đầu.
- FC 26 truy cập được bằng menu, hero link và khu riêng.
- Cả bốn ảnh người dùng cung cấp được sử dụng đúng ngữ cảnh.
- Không có banner Autumn Sale cạnh tranh với campaign mới.
- CSS/Tailwind dùng cùng primitive; không còn xanh neon hardcode trong homepage.
- Không tràn ngang ở 320, 390, 768, 1024, 1440px; FAQ/menu mở được bằng bàn phím.
- Một h1, hình ảnh tải được, không có lỗi JavaScript homepage.
- TypeScript, lint file đã đổi, unit tests và production build được kiểm tra.

Kết quả kiểm tra thực tế được ghi ở FC27-VALIDATION.md.
