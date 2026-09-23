# DungDiBinhLuan — Design language / FC 27

Cập nhật: 23/09/2026. Sau đợt UI-UPGRADE-BLUEPRINT: áp dụng toàn site, không chỉ trang chủ.
Nguồn sự thật về màu: app/globals.css. Quy tắc triển khai trang chủ: app/home.module.css.
Primitives dùng chung: app/components/ui/ (Button, Badge, Card, Field, Dialog, states, ...).

## 1. Tinh thần thiết kế

**Đêm trước mùa giải mới.** Một trang game có chất biên tập: ảnh cầu thủ đủ lớn, tiêu đề mạnh, nền gần đen, coral trầm dẫn mắt đến hành động. Khoảng trống giúp ảnh và giá có sức nặng. Ưu tiên sự rõ ràng và cảm xúc bóng đá.

Mục tiêu trang chủ: khách hiểu ngay FC 27 đang nhận đặt trước, giá 180.000đ, chơi khi game ra mắt; khách FC 26 vẫn tìm được game và mods hiện tại.

## 2. Bảng màu chuẩn

| Primitive / semantic | Giá trị | Vai trò |
| --- | --- | --- |
| --brand-canvas / --color-surface-0 | #090a0f | Nền trang gần đen, giống tinh thần ảnh tham chiếu |
| --brand-card / --color-surface-1 | #14131b | Card, thanh chuyển mùa, vùng bài viết |
| --brand-raised / --color-surface-2 | #201c26 | Nút phụ, hover, vùng nổi |
| --brand-coral / --color-accent / --color-coral / --color-primary | #cf5c69 | CTA, giá, nhấn FC 27 |
| --brand-coral-hover / --color-accent-strong | #dd7480 | Hover CTA |
| --color-on-accent | #100c10 | Chữ tối trên coral, tăng độ tương phản |
| --color-title | #f4f5f7 | Tiêu đề |
| --color-body | #b6bcc9 | Nội dung |
| --color-muted | #9499a8 | Metadata, chú thích |
| --color-line | rgba(255,255,255,.08) | Viền thường |
| --color-line-strong | rgba(255,255,255,.14) | Viền rõ hơn |
| --color-campaign-amber / --color-credit | #f5a623 | Cam điểm nhấn chiến dịch; đồng thời là màu credit/ví |
| --color-credit-strong | #ffc15c | Hover/nhấn mạnh của credit |
| --color-violet / --color-signal | #8f7bf7 | Nhấn phụ: thư viện, tài khoản, tính năng nổi bật |
| --color-signal-strong | #a794ff | Hover của violet |
| --color-ok | #3ddc97 | Thành công/uy tín |
| --color-warn | #f4b860 | Cảnh báo/pending |
| --color-danger | #f45d6a | Lỗi/xóa |
| --color-*-subtle | color-mix(14–16% màu + surface-1) | Nền nhạt cho badge/notice của accent, credit, ok, warn, danger, violet |
| --color-*-border | color-mix(38% màu + transparent) | Viền tương ứng của accent và credit |
| --color-overlay | rgba(5,5,9,.72) | Lớp phủ dialog/lightbox/drawer |
| --color-focus-ring | --color-coral-strong | Màu vòng focus |

**Lớp z-index chuẩn** (không dùng số ngẫu nhiên): `--layer-sticky` 10 · `--layer-navbar` 30 · `--layer-sticky-action` 40 · `--layer-popover` 50 · `--layer-support` 60 · `--layer-overlay` 80 · `--layer-modal` 90 · `--layer-toast` 100. Dùng qua `z-[var(--layer-…)]`.

**Không nối alpha vào var()** (`var(--color-x)1A` là sai). Muốn bản nhạt/border của một màu: dùng token `-subtle`/`-border` đã khai báo, hoặc `color-mix()`.

Màu được chọn gần với ảnh người dùng cung cấp; không khẳng định là giá trị gốc tuyệt đối vì ảnh chụp có lớp phủ/độ sáng khác nhau. Nền trước lần sửa này đang là #0f0708, surfaces #140a0d/#1d1015/#2a161d, accent #f06078. Những thay đổi đó đã tồn tại trên đĩa và chưa commit.

### Quy tắc màu

- Primitive chỉ khai báo một lần ở :root; semantic aliases và Tailwind cùng tham chiếu primitive.
- Nền tối chiếm phần lớn trang. Coral dành cho điểm cần quyết định và nhận diện chiến dịch.
- Cam là tùy chọn cho campaign nhỏ; không biến cả trang thành cam hoặc nâu.
- Không dùng xanh neon để trang trí mods ở trang chủ. Xanh thành công vẫn có nghĩa riêng trong nút uy tín.
- Không dùng giá trị màu cứng trong component mới khi đã có token tương ứng.
- Homepage dùng chữ tối trên nút coral. Component cũ dùng chữ trắng cần được kiểm tra contrast khi migrate; thay token toàn cục không đồng nghĩa mọi trang đã được thiết kế lại.

## 3. Chữ và nhịp điệu

Font duy nhất: Be Vietnam Pro, hỗ trợ tiếng Việt; giữ loader hiện tại.

| Cấp | Desktop | Mobile | Weight / line height |
| --- | --- | --- | --- |
| Tên EA FC 27 | 90–116px | 76px | 900 / 1; italic |
| Thông điệp hero | 46px | 32px | 900 / 1.22 |
| Tiêu đề section | 26–38px | 26px | 900 / 1.25 |
| Tiêu đề card | 19–23px | 17–23px | 700 / 1.4 |
| Nội dung | 13–15px | 13px | 400 / 1.7–1.9 |
| CTA | 11px | 10–11px | 900 |
| Eyebrow/metadata | 9–10px | 8–10px | 700 |

Chữ nhỏ chỉ dành cho thông tin phụ; giá, phiên bản, trạng thái, nút đặt phải luôn đọc được. Tiêu đề tracking -0.04em; tên game -0.07em. Uppercase giới hạn cho nhãn ngắn. Không viết toàn bộ đoạn văn bằng chữ hoa.

Type scale utility cho toàn site (định nghĩa trong globals.css): `text-h1`, `text-h2`, `text-h3` cho tiêu đề; `text-body`, `text-meta` cho nội dung/metadata; `text-price` + `tabular` cho giá và số (tabular-nums để cột số không nhảy). Trang chủ giữ scale lớn riêng của hero; các trang còn lại dùng scale utility này.

## 4. Bố cục

- Container trang chủ 1200px, lề desktop 32px, mobile 20px.
- Grid chính: khu đặt trước 60/40; bài viết và FAQ 38/62; mods 4 → 2 → 1 cột.
- Section cách nhau khoảng 64px desktop / 42px mobile.
- Hero mở đầu bằng một ảnh chủ đạo và một CTA. Không carousel tự chạy.
- FC 26 có ảnh và nút chọn phiên bản riêng; mức nhấn thấp hơn FC 27.
- Navbar giữ logo, đăng nhập, ví, quản trị và uy tín; điều hướng FC 27, FC 26, Mods, game, hướng dẫn. Menu chuyển dạng thu gọn dưới 1280px để tránh chen chúc.
- Fixed navbar được bù khoảng trống bởi root layout; không cộng padding lần nữa ở trang chủ.

## 5. Components và trạng thái

### CTA

Primary: coral, chữ tối, radius 10px, cao tối thiểu 52px, bóng nhẹ. Hover sáng hơn và dịch lên 2px. Secondary: raised surface, viền mảnh, chữ sáng. Link thường có mũi tên, hover sáng lên.

Hero CTA cuộn đến #dat-truoc. CTA xác nhận mở Facebook với nhãn rõ “Liên hệ đặt trước”. Không mô phỏng thanh toán thành công.

### Card và hình ảnh

Radius 12–16px; viền 1px; tối đa một lớp card. Ảnh giữ tỷ lệ, object-fit cover; không kéo méo hoặc che mặt cầu thủ bằng text chính trên desktop. Hero có gradient bảo vệ độ đọc. Giá nằm trong HTML, không chèn vào ảnh.

### FAQ

Dùng details/summary native: mở bằng chuột hoặc Enter/Space, nội dung vẫn hoạt động khi không có JavaScript. Icon cộng xoay khi mở, không thay nhãn câu hỏi.

### Nội dung động

Mods lấy từ database và dữ liệu có sẵn, bỏ trùng theo slug, ưu tiên dữ liệu database. Bài viết dùng nguồn hiện tại. Khi không có bài viết, hiển thị lời dẫn và link đến chuyên mục. Không dựng số lượt mua, review hay đồng hồ đếm ngược giả.

### Accessibility và motion

Một h1; section có h2 và aria-labelledby; nút menu có nhãn và aria-expanded. Focus ring coral 2px; mọi ý nghĩa trạng thái có chữ đi kèm. Anchor có scroll-margin để tránh navbar che tiêu đề. Motion 150–250ms, tôn trọng prefers-reduced-motion.

## 6. Giọng văn

Thân thiện, trực tiếp, mang tinh thần bóng đá. Dùng “anh em” vừa phải. Ưu tiên các câu ngắn: “Mùa giải mới. Đam mê tiếp nối.”, “Chơi ngay khi game ra mắt.”, “Sân cỏ vẫn đang chờ bạn.”

Không tự thêm ngày phát hành, quyền lợi Ultimate, chơi online, quà tặng hay hỗ trợ mod FC 27 khi chưa xác nhận. Ảnh có tên edition chỉ là minh họa; FAQ làm rõ cần xác nhận gói.

## 7. Phạm vi migration

Đã áp dụng: homepage, navbar/footer, mods catalog + mod detail, credit, payment/checkout, account, hướng dẫn/bài viết, DMCA, admin shell. Toàn site dùng chung tokens + primitives trong `app/components/ui/`; admin có shell riêng (`AdminShell`) không lẫn chrome công khai.

Dialog/lightbox ghi `body[data-modal-open]` để support bubble tự ẩn. Trạng thái route (tab account, filter/search/sort/page của catalog) nằm trên URL. Motion 150–250ms, tôn trọng prefers-reduced-motion.

Blueprint cụ thể: FC27-HOMEPAGE-BLUEPRINT.md (trang chủ), UI-UPGRADE-BLUEPRINT.md (toàn site).
