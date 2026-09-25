# Blueprint — Database cầu thủ cho DungDiBinhLuan

Ngày: 25/09/2026. Trạng thái: đề xuất triển khai, chưa thay đổi ứng dụng hay database.

## 1. Quyết định đã chốt

- Nguồn: project `C:\Users\ADMIN\Documents\trae_projects\TRAM CAREER HUB`.
- Đích: website tại `C:\dungdibinhluan`.
- Chỉ lấy **database cầu thủ**, không chuyển toàn bộ database vận hành của Trạm.
- Lấy đầy đủ cầu thủ trong bộ dữ liệu được phê duyệt; chỉ xuất các trường nằm trong danh sách cho phép bên dưới.
- MVP gồm **danh sách, tìm kiếm, bộ lọc và trang chi tiết**. Không cần đăng nhập để tra cứu.
- Có **giá và lương/tuần**. Ưu tiên giá thị trường; thiếu thì dùng giá Career.
- **100 cầu thủ POT cao nhất được tăng 10% giá cơ sở**. Lương không tăng.
- Không mang công cụ, nhận xét, nội dung biên tập hay thiết kế đặc trưng của Trạm sang.
- Dùng bản dữ liệu riêng ở đích, không để trình duyệt hay từng lượt xem trang gọi sang Trạm.

**Định nghĩa “toàn bộ”: đầy đủ bản ghi cầu thủ hợp lệ của bộ dữ liệu đã chọn, không phải toàn bộ bảng/cột, mọi mùa lịch sử hoặc mọi tính năng.** Không chỉ lấy cầu thủ nổi tiếng, nam, POT cao hay có giá. Cầu thủ thiếu giá vẫn xuất hiện.

## 2. Giới hạn tách biệt thương hiệu

Mục tiêu thực tế là trải nghiệm DungDiBinhLuan độc lập và không vô tình công khai kết nối nội bộ: không nhúng API, khóa, đường dẫn lưu trữ hay metadata của Trạm vào frontend.

Không có kiến trúc nào bảo đảm người ngoài không suy ra hai site có chung dữ liệu hoặc chủ sở hữu. Danh sách, sai lệch chỉ số, ảnh, lịch cập nhật và thông tin vận hành công khai đều có thể tạo liên hệ. Tăng 10% giá không phải biện pháp ẩn danh; quan hệ toán học này cũng có thể được nhận ra.

Không bịa chủ sở hữu, không xóa ghi công bắt buộc, không bỏ thông tin pháp lý phải công bố. Chỉ đồng bộ dữ liệu được phép tái sử dụng. Việc ghi nguồn giá thị trường bên thứ ba không đồng nghĩa phải công khai đường kết nối database nội bộ.

## 3. Kết quả khảo sát repo

| Bằng chứng trong project nguồn | Ý nghĩa cho triển khai |
| --- | --- |
| `supabase/migrations/add_players.sql` | Bảng `players`, khóa chính `id` là ID cầu thủ EA; có `game_version`, `stats`, tên, vị trí, đội tuyển/CLB. |
| `players_career_fields.sql`, `players_career_full_fields.sql` trong cùng thư mục migrations | Có POT, giá, lương và nhiều trường Career mở rộng. |
| `supabase/migrations/20260918_players_lockdown.sql` | Thu hồi quyền trực tiếp của `anon`/`authenticated`; RPC catalog cũng bị giới hạn. Không mở lại quyền để lấy dữ liệu. |
| `app/api/players/route.ts` | API public có rate limit; `withStats` phải đi cùng danh sách ID giới hạn. Đây không phải endpoint xuất toàn bộ database. |
| `lib/server/players.ts` | Truy vấn catalog phía server, danh sách khác chi tiết; `stats` chứa các giá trị dạng `{ value, diff? }`. |
| `lib/server/player-market-value.ts` và `lib/data/player-market-values.json` | Nguồn gốc giá thị trường nằm ngoài bảng: map theo ID chứa `value`, `date`, `url`; helper chỉ nhận nguồn khi giá map bằng `value_eur`. |
| `scripts/update-market-values.mjs` | Có luồng ghi giá thị trường vào chính `players.value_eur`. Không được coi mọi giá trong cột này là giá Career hoặc đều là giá thị trường. |
| `supabase/migrations/players_sync_from_save_rpc.sql` | Có khả năng ghi đè chỉ số, CLB, POT, lương và phiên bản bằng dữ liệu từ save. Cần xác minh bộ dữ liệu được xuất, không suy đoán đó luôn là dữ liệu game gốc. |
| `app/players/[slug]/page.tsx` | UI hiện gọi `wage_eur` là lương/tuần; có nhận xét cầu thủ, biến thể đặc biệt và nhiều khối không cần chuyển. |

Ở đích đã có Next.js 16, React 19, TypeScript, Tailwind 4, Supabase, Vitest và các UI primitives. `lib/catalog/` hiện phục vụ **mod**, không dùng chung tên/model đó cho cầu thủ. Chưa thấy route cầu thủ trong cây route đã khảo sát.

Các nhận định trên dựa trên file local, **chưa xác minh schema production, số lượng bản ghi, tỷ lệ có giá hay migration đã apply**. Không đọc `.env.local`, không chạy export/import và không truy cập database thật trong bước viết blueprint.

### Những điểm phải xác nhận trước khi triển khai

1. Người vận hành được phép xuất và tái sử dụng dữ liệu, giá và ảnh.
2. Schema/grants thực tế, số lượng cầu thủ và phân bố `game_version`.
3. Bộ dữ liệu là bản game nào, ngày dữ liệu nào; có lẫn chỉ số từ save cá nhân hay không.
4. Nguồn gốc và đơn vị lương: MVP là **lương trong game, EUR/tuần**, không tự gọi đó là lương ngoài đời.
5. Map giá thị trường tương ứng với lần cập nhật nào; dữ liệu Career dùng fallback còn xác minh được ở đâu.
6. Database đích và nguồn có thật sự khác project hay chưa. Không thay cấu hình auth/payment hiện tại chỉ để tách module này.

Schema nguồn dùng khóa `id`, không phải `(game_version, id)`, nên không chứng minh có lịch sử riêng đầy đủ cho FC 26 và FC 27. MVP chỉ công bố phiên bản đã kiểm tra; không đổi nhãn FC 26 thành FC 27 theo tên trang chủ.

## 4. Phạm vi dữ liệu

### 4.1. Lấy sang

| Nhóm | Trường nguồn / dữ liệu xuất | Hiển thị |
| --- | --- | --- |
| Danh tính | `id`, `display_name`, tên phục vụ tìm kiếm | Tên cầu thủ; ID chỉ dùng nội bộ/routing. |
| Phiên bản | `game_version`, ngày bộ dữ liệu đã xác minh | Nhãn bản game đúng dữ liệu. |
| Đội bóng | `team_id`, `team_name`, `league_name` | CLB và giải đấu. |
| Quốc tịch, giới tính | `nationality_id`, `nationality_name`, `gender` | Quốc tịch; bộ lọc nam/nữ khi có cả hai. |
| Vị trí | `position_short`, `alt_positions` | Vị trí chính, vị trí phụ trong chi tiết. |
| Chỉ số | `overall_rating`, `potential` | Tổng quát, Tiềm năng. |
| Cá nhân | `birthdate`, `height_cm`, `weight_kg`, `preferred_foot`, `skill_moves`, `weak_foot` | Tuổi và thông tin cơ bản. |
| Kỹ năng | Các key chuẩn đã duyệt trong `stats`, chỉ lấy `.value` | Nhóm chỉ số cơ bản và phần chi tiết thu gọn. |
| Giá thị trường | Giá đã đối chiếu + nguồn + ngày định giá | Dùng làm giá cơ sở ưu tiên. |
| Giá Career | Giá Career có nguồn gốc xác minh | Fallback khi thiếu giá thị trường. |
| Lương | `wage_eur` và đơn vị được xác nhận | Lương/tuần; giữ nguyên. |
| Ảnh | `avatar_url`, tùy chọn ảnh CLB/quốc gia có quyền sử dụng | Chỉ dùng khi đưa được qua luồng media được phê duyệt; thiếu dùng chữ viết tắt. |

Tuổi tính theo ngày tham chiếu của bộ dữ liệu, không tự tăng theo ngày người xem truy cập rồi làm sai tuổi trong bản game. Không coi CLB trống là cầu thủ tự do nếu chưa xác minh mã đội.

### 4.2. Không lấy sang MVP

- Auth, profiles, quyền admin, email, tài khoản, phiên đăng nhập.
- Đơn hàng, credit, membership, thanh toán, lịch sử tải và quyền mở mod.
- Mods, guides, nội dung cộng đồng.
- Đội hình, chấm đội hình, AI/nhận xét cầu thủ, độ hợp vị trí, gợi ý chuyển nhượng.
- Career Tracker, shortlist tài khoản, save sessions, save editor, exports và file save.
- Roulette, đoán cầu thủ, minigame, bảng xếp hạng người chơi.
- GOAT layout, nhóm tuyển chọn/đề xuất độc quyền, thuật toán tính điểm riêng, cấu hình engine.
- Các trường Career nâng cao chưa cần: phí giải phóng, danh tiếng, hợp đồng, rating từng vị trí, tags/traits/abilities.
- HTML, CSS, React component, bộ font, logo, ảnh thương hiệu, slogan, OG và nội dung SEO của Trạm.

## 5. Quy tắc giá và lương — bắt buộc

### 5.1. Chọn giá cơ sở

```text
market = giá thị trường được xác minh cho đúng cầu thủ
career = giá Career được xác minh cho đúng cầu thủ/bộ dữ liệu

base_value_eur = market nếu có; nếu không thì career; nếu đều thiếu thì null
base_value_kind = market | career | unknown
```

Không lấy `value_eur` rồi mặc định toàn bộ là market. Adapter xuất dữ liệu phải ghép `players` với thông tin nguồn giá:

- Tối thiểu tái hiện kiểm tra của `getMarketValueSource`: map cùng ID, `map.value === players.value_eur`; đồng thời kiểm tra giá, ngày và nguồn hợp lệ.
- Nếu không khớp: không tự gắn nhãn market. Chỉ dùng làm Career khi xác minh được nguồn Career từ dữ liệu nhập hoặc bản ghi nguồn đã duyệt.
- **Không có map không chứng minh đó là giá Career.** Nếu giá đã bị ghi đè nhưng provenance thiếu, cần phục hồi từ nguồn nhập có cấp quyền hoặc để thiếu; không đoán loại giá.
- Nếu có cả hai loại giá đáng tin, thị trường được ưu tiên. Không lấy trung bình, không dùng giá lớn hơn, không fallback chỉ vì giá thị trường thấp.
- Giá có ngày trong tương lai hoặc dữ liệu âm/sai đơn vị phải bị chặn. Giá cũ giữ đúng ngày định giá, không thay ngày bằng thời điểm đồng bộ.
- `0` chỉ được coi là giá hợp lệ khi nguồn thực sự xác nhận; không dùng `0` để biểu diễn thiếu. Nếu nguồn dùng `0` làm sentinel thì adapter chuyển `null` theo quy tắc của nguồn đó.

Map giá thị trường là **dữ liệu tham chiếu cần thiết**, được xuất ở dạng chuẩn hóa dù nằm ngoài SQL. Không sao chép cả thư mục dữ liệu/logic nguồn.

### 5.2. Nhóm 100 POT cao nhất

Tính một lần trên **toàn bộ cầu thủ của bản dữ liệu/phiên bản đang công bố**, trước tìm kiếm, lọc và phân trang:

1. Chỉ xét cầu thủ có POT hợp lệ, không `null`.
2. Sắp `potential DESC`, rồi `overall_rating DESC`, rồi `id ASC`.
3. Lấy đúng 100 đầu, hoặc tất cả nếu tập có POT hợp lệ ít hơn 100.
4. Không lọc theo nam/nữ, CLB, giá hay vị trí trước khi chọn.
5. Cầu thủ top 100 thiếu cả hai giá vẫn nằm trong nhóm nhưng giá hiển thị là thiếu; **không thay bằng người thứ 101**.
6. Nhóm được tính lại khi xuất bản bộ dữ liệu mới, không thay đổi trong một bản dữ liệu.

### 5.3. Công thức

```text
adjustment_bps = 1000 nếu thuộc top 100 POT, ngoài nhóm là 0
reference_value_eur = round_half_up(base_value_eur × (10000 + adjustment_bps) / 10000)
weekly_wage_eur = wage_eur đã chuẩn hóa, không áp dụng adjustment
```

Tiền được chuẩn hóa thành số nguyên EUR. Tính bằng integer/decimal chính xác; với số nguyên không âm có thể dùng `(base * factor + 5000) / 10000` với phép chia nguyên. Kiểm tra giới hạn số an toàn khi đổi bigint sang JSON; không nhân floating point rồi làm tròn tùy ý.

Luôn tính từ **giá cơ sở**, không nhân tiếp giá hiển thị của lần đồng bộ trước. Retry cùng dữ liệu không được biến 10% thành 21%.

| Ví dụ kiểm thử, không phải giá cầu thủ thật | Cơ sở | Thuộc top 100 | Giá hiển thị | Lương/tuần |
| --- | ---: | --- | ---: | ---: |
| Có giá thị trường, đồng thời có Career | €100.000.000 market | Có | €110.000.000 | Giữ nguyên |
| Chỉ có Career | €20.000.000 Career | Có | €22.000.000 | Giữ nguyên |
| Có thị trường | €100.000.000 market | Không | €100.000.000 | Giữ nguyên |
| Thiếu cả hai giá | Chưa có | Có | Chưa có | Vẫn hiện nếu có |

### 5.4. Cách ghi trên UI

- Cột danh sách: **Giá tham khảo**, **Lương/tuần**.
- Chi tiết: giá hiển thị lớn; bên dưới **Cơ sở: Giá thị trường** hoặc **Cơ sở: Giá Career**.
- Cầu thủ được điều chỉnh: dòng ngắn **“Đã cộng 10% vào giá cơ sở.”** Không gọi giá đã tăng là giá thị trường nguyên bản.
- Giá thị trường có nguồn và ngày định giá ở chi tiết; không ghi công sai cho Career fallback.
- Lương ghi **“Lương trong game / tuần”** ở chi tiết. Không biến thành lương thực tế chỉ vì giá cơ sở là market.
- Thiếu số liệu: **“Chưa có”**, không `€0`, không ước lượng tự phát.
- Danh sách có thể rút gọn theo triệu/nghìn EUR; trang chi tiết có số đầy đủ. Lọc và sort dùng số nguyên chưa rút gọn.
- Không quy đổi VND trong MVP để tránh thêm tỷ giá và hiểu nhầm.

## 6. Kiến trúc đồng bộ qua web

```text
Nguồn có cấp quyền: players + provenance giá
                  |
        Tác vụ xuất phía server nguồn
        snapshot nhất quán + projection cho phép
                  |
        Gói export riêng tư qua HTTPS
        manifest + các chunk bất biến
                  |
        Tác vụ nhập riêng tại đích
        kiểm tra -> chọn giá -> top 100 -> tính giá -> staging
                  |
        Database catalog độc lập, kích hoạt nguyên tử
                  |
        Next.js đích -> trang/API cùng origin -> người dùng
```

### 6.1. Phương án chọn

**Đồng bộ một chiều theo lô**, không proxy live và không dùng chung database Trạm cho lượt xem trang.

- Lần đầu xuất đầy đủ. Sau đó đồng bộ khoảng mỗi ngày hoặc khi chủ dữ liệu phát hành bản mới; chưa cần realtime, CDC, Kafka hay dashboard quản trị mới.
- Nguồn chủ động tạo snapshot sau khi ingest và map giá hoàn tất. Không giữ một request HTTP công khai chờ xuất toàn bộ bảng.
- Đích chỉ có quyền tải gói export được cấp riêng; không giữ service-role key của Trạm.
- Exporter ở nguồn dùng quyền đọc tối thiểu được chủ dự án phê duyệt. Nếu dùng service role hiện hữu, khóa chỉ ở môi trường server nguồn, không đưa vào gói export/log.
- Token tải gói chỉ cho phép đọc snapshot catalog; tách khỏi admin, auth và tài khoản người dùng. Không đưa token vào query string/frontend.
- Website không truy cập nguồn trong mỗi request; nguồn lỗi không làm catalog đang chạy tại đích sập.

### 6.2. Gói export

- Manifest nội bộ: mã bản xuất, bản game, ngày dữ liệu, schema version, số bản ghi, danh sách chunk và SHA-256 từng chunk.
- Chunk JSON/NDJSON theo projection cố định, ví dụ 500 bản ghi/chunk; không `SELECT *`, không dump toàn DB.
- Export đọc từ snapshot nhất quán hoặc cửa sổ ingest được khóa đúng cách; keyset theo `id`, không quét offset trên bảng đang biến động rồi giả định đủ dữ liệu.
- Bảng và map giá phải được ghép từ cùng bản phát hành. Bản xuất được đánh dấu hoàn tất sau cùng; đích không đọc bản đang xây dựng.
- HTTPS và xác thực bảo vệ quyền truy cập; checksum chỉ kiểm tra tính toàn vẹn, không thay thế xác thực.
- Server không trả export URL, token, tên storage bucket hay manifest nguồn cho trình duyệt.

### 6.3. Nhập và công bố

1. Lấy manifest đã hoàn tất, kiểm tra game/schema được hỗ trợ và giới hạn dung lượng.
2. Tải đủ chunk có deadline, retry có backoff và giới hạn số lần; không bypass rate limit.
3. Kiểm checksum, trùng ID, kiểu dữ liệu, tiền/đơn vị và đối chiếu tổng bản ghi với manifest.
4. Chuẩn hóa theo allowlist. Trường lạ không được tự động xuất hiện trong API đích.
5. Tính giá theo mục 5 trên toàn tập, ghi vào staging. Không tính riêng từng chunk hoặc từng trang.
6. Lỗi bản ghi bắt buộc: từ chối bản xuất hoặc cách ly để người vận hành duyệt; không âm thầm bỏ dòng rồi công bố là đầy đủ.
7. Kích hoạt bản mới trong một transaction sau khi tất cả kiểm tra đạt. Đảm bảo mỗi phiên bản chỉ có một bản active.
8. Invalidate cache đích; trả dữ liệu từ bản active. Các tác vụ đồng bộ đồng thời phải dùng lock và khóa idempotency.
9. Giữ bản trước để rollback; không truncate catalog đang chạy. Cầu thủ biến mất chỉ ngừng công bố sau một snapshot đầy đủ được duyệt, không dựa vào batch lỗi.

Giảm mạnh số lượng bản ghi, POT hoặc độ phủ giá so với bản trước: giữ bản hiện tại, báo người vận hành. Ngưỡng cảnh báo phải dựa trên baseline thật, không tự bịa tỷ lệ dữ liệu hoàn chỉnh.

## 7. Lưu trữ đích tối thiểu

Đề xuất hai bảng riêng cho module, không sửa bảng tài khoản/mod/thanh toán:

| Bảng đề xuất | Nội dung |
| --- | --- |
| `player_catalog_releases` | ID nội bộ, game version, ngày dữ liệu, manifest/checksum, count, trạng thái staging/active/archived/failed, thời điểm nhập. Unique partial index bảo đảm một active/game. |
| `player_catalog_entries` | Khóa `(release_id, ea_player_id)`, slug, trường cầu thủ đã duyệt, stats chuẩn hóa, provenance tài chính và giá tính sẵn. |

Các trường tài chính đích cần có:

```text
base_value_eur          bigint nullable
base_value_kind         market | career | unknown
valuation_date          date nullable
valuation_source_name   text nullable
valuation_source_url    text nullable
adjustment_bps          integer: 0 hoặc 1000
reference_value_eur     bigint nullable
weekly_wage_eur         bigint nullable
wage_basis              game_weekly_eur | unknown
```

- Bảo toàn provenance nội bộ; public DTO chỉ trả thông tin cần hiển thị và ghi công.
- ID EA là định danh dữ liệu thể thao, không phải bằng chứng riêng về chủ sở hữu. Không cần đổi ID ngẫu nhiên để tạo cảm giác ẩn danh.
- Slug đích tạo ổn định từ tên + EA ID, xử lý trùng tên; không phụ thuộc slug của Trạm. Không render ID thành nhãn người dùng.
- Index khởi đầu: release + OVR/POT, tên tìm kiếm chuẩn hóa, vị trí, đội, quốc tịch, giá hiển thị và lương. Kiểm query plan trước khi thêm index khác.
- Role runtime chỉ đọc projection catalog active; role nhập được ghi staging/kích hoạt. Không cấp quyền đọc manifest hoặc provenance nội bộ cho `anon`.
- Bật RLS và kiểm grants/RPC theo mô hình đích; không giả định bật RLS đủ bảo vệ khi dùng service role.
- Chưa xóa bản cũ tự động trong MVP. Chính sách dọn dữ liệu được phê duyệt riêng.

## 8. API và hành vi tra cứu

### Routes đề xuất

| Route | Vai trò |
| --- | --- |
| `/cau-thu` | Danh sách, tìm kiếm, lọc và phân trang. |
| `/cau-thu/[slug]` | Chi tiết cầu thủ. |
| `/api/cau-thu` | Chỉ trả list DTO và phân trang. |
| `/api/cau-thu/bo-loc` | Tùy chọn từ catalog active; không lấy toàn bộ players về browser để tạo dropdown. |

Chi tiết đọc trực tiếp qua server repository; không cần thêm detail API nếu không có consumer khác.

- Tìm theo tên, hỗ trợ không dấu; giới hạn độ dài input và escape wildcard/query đặc biệt.
- Bộ lọc chính: vị trí, CLB, quốc tịch, Tổng quát, Tiềm năng.
- Bộ lọc mở rộng gọn: giải đấu, nam/nữ khi có, giá tham khảo từ/đến, lương/tuần từ/đến.
- Nhãn khoảng tiền ghi rõ EUR và EUR/tuần; query gửi EUR nguyên, không gửi chuỗi `20 triệu`.
- **Lọc/sort giá theo `reference_value_eur` sau điều chỉnh**, không theo giá nguồn. Lương theo số giữ nguyên.
- Sort: Tổng quát, Tiềm năng, Tên A–Z, Giá tăng/giảm, Lương tăng/giảm. Thêm EA ID làm tie-break cuối.
- Giá/lương `null` luôn ở cuối khi sort. Khi lọc khoảng tiền, bỏ các bản ghi thiếu giá trị tương ứng; không coi thiếu là 0.
- Page size mặc định 25, tối đa 50; không trả toàn bộ stats trong response danh sách.
- Lưu search/filter/sort/page trên URL; thay bộ lọc quay về trang 1. Back/Forward khôi phục trạng thái.
- Giữ cùng release trong một lượt đọc/count/options. Phân trang được ghim bằng revision đích không chứa thông tin nguồn; khi revision không còn khả dụng, yêu cầu tải lại trang 1 thay vì âm thầm trộn bản.
- Debounce tìm tên, hủy request cũ; không cho kết quả chậm ghi đè lựa chọn mới.
- Validate enums, số nguyên, khoảng min/max và giới hạn trang; rate limit server, timeout hữu hạn.
- Cache đọc gắn với release và query đã chuẩn hóa. Đồng bộ xong cập nhật cache; lỗi không được cache thành danh sách trống hay 404.
- Response lỗi công khai dùng tiếng Việt; lỗi database/provider và token chỉ xử lý nội bộ, không trả stack trace.

## 9. Thiết kế khác Trạm, vẫn đúng thương hiệu đích

### Hướng chọn: danh bạ bóng đá gọn

Không dựng thêm một hub Career. Người xem vào là tìm cầu thủ được ngay, không qua hero lớn, thẻ game hay lời giới thiệu tính năng.

Giữ token DungDiBinhLuan theo `DESIGN.md`, `NGON-NGU-THIET-KE.md`, `app/globals.css`: nền tối trung tính, coral trầm và Be Vietnam Pro. Không thêm palette mới; không bê pitch-green, font riêng, nền sân hay CSS Trạm sang.

### 9.1. Danh sách desktop

```text
Navbar DungDiBinhLuan hiện tại + mục “Cầu thủ”

Cầu thủ
Tìm cầu thủ theo vị trí, chỉ số và ngân sách.

[Tìm tên cầu thủ.................................]
[Vị trí] [CLB] [Quốc tịch] [Bộ lọc] [Sắp xếp]

Cầu thủ / CLB | Vị trí | Tổng quát | Tiềm năng | Giá tham khảo | Lương/tuần
Tên cầu thủ  | ST     | ...       | ...       | ...           | ...
...

[Trước]                    Trang ...                    [Sau]
```

- Một bảng cố định, không tùy chỉnh 20 cột, không đổi card/table, không panel dashboard.
- Tên cầu thủ là link rõ ràng; số canh phải, dùng tabular numerals.
- Row khoảng 68–76px; avatar nhỏ tùy chọn, có placeholder ổn định.
- OVR/POT là số và nhãn, không dùng bộ huy hiệu/xếp hạng màu của Trạm.
- Container tối đa khoảng 1200px; reuse primitives `Container`, `Button`, `Field`, `Dialog`, `Skeleton`, `states` của đích.

### 9.2. Mobile

- Tìm kiếm toàn chiều ngang, nút **Bộ lọc** và **Sắp xếp**.
- Mỗi dòng thành một mục: tên + CLB; vị trí/OVR/POT; **giá và lương đều nhìn thấy**, không ép cuộn ngang.
- Bộ lọc mở dialog/drawer có **Áp dụng**, **Xóa bộ lọc**, focus trap và trả focus khi đóng.
- Không sidebar cố định; không sticky CTA che dòng cuối hoặc nút phân trang.

### 9.3. Chi tiết

```text
Cầu thủ > Tên cầu thủ

[Ảnh nhỏ] Tên cầu thủ
          CLB · Quốc tịch · Vị trí

Tổng quát ...       Tiềm năng ...

Giá tham khảo ...                    Lương trong game / tuần ...
Cơ sở: Giá thị trường hoặc Giá Career
Đã cộng 10% vào giá cơ sở.            Chỉ hiện nếu có điều chỉnh
Nguồn và ngày định giá               Khi đã xác minh

Thông tin cơ bản
Tuổi · Chiều cao · Cân nặng · Chân thuận · Kỹ thuật · Chân yếu

Chỉ số
Các nhóm kỹ năng gọn; chi tiết mở bằng accordion

[Quay lại danh sách]
```

Không có phân tích điểm mạnh/yếu, gợi ý mua, độ hợp đội hình, sân mini, top kỹ năng độc quyền hay GOAT treatment. Thủ môn có nhóm bắt bóng riêng, không gắn nhãn PAC/SHO máy móc.

### 9.4. Copy và trạng thái

| Tình huống | Nội dung |
| --- | --- |
| Đang tải | Đang tìm cầu thủ… |
| Không khớp bộ lọc | Chưa tìm thấy cầu thủ phù hợp. Thử bỏ bớt bộ lọc. |
| Lỗi tạm thời | Chưa tải được danh sách. Thử lại nhé. |
| Không tồn tại | Không tìm thấy cầu thủ này. Quay lại danh sách. |
| Thiếu số liệu | Chưa có |

Không đưa hash, ID, tên bảng, engine, cron, Supabase, RPC hay timestamp kỹ thuật lên UI. Revision/checksum chỉ phục vụ code và vận hành. Không cần dòng “đã đồng bộ thành công” cho người tra cứu.

Đảm bảo keyboard, focus-visible, nhãn form, contrast, reduced motion, mục tiêu chạm khoảng 44px; kiểm tra từ 320px. Giá trị, nguồn và chú thích điều chỉnh phải đọc được trên mobile, không chỉ có hover tooltip.

## 10. Media, metadata và SEO

- Không hotlink ảnh từ domain/storage của Trạm. Nếu được phép, nhập ảnh sang kho đích; nếu chưa được phép thì dùng initials, không cản catalog ra mắt.
- Tác vụ nhập ảnh chỉ tải từ allowlist nguồn được phê duyệt, kiểm redirect/IP/type/size và chống SSRF; không tạo proxy nhận URL tùy ý.
- Không sao chép watermark rồi xóa, không bỏ attribution bắt buộc của ảnh/dataset.
- Metadata, canonical, Open Graph và sitemap theo origin DungDiBinhLuan; không clone metadata Trạm.
- Tên trang và bản game sinh từ dữ liệu đã xác minh. Không hứa giá thị trường khi một cầu thủ dùng Career fallback.
- URL filter/search đặt chính sách noindex/canonical nhất quán để tránh nhân bản vô hạn. Chi tiết và trang danh sách chuẩn có thể index.
- Không bịa traffic, lượt xem, lượt cập nhật hay tác giả. Không tuyên bố dataset độc quyền nếu không có căn cứ.
- Kiểm tra HTML, RSC payload, Network, bundle và lỗi API để bảo đảm không lộ khóa, export URL hoặc metadata nguồn nội bộ; việc này không phải cam kết giấu được chủ sở hữu.

## 11. Kế hoạch triển khai

### A. Chuẩn bị dữ liệu

- Xác minh quyền sử dụng, schema/grants thực tế, bản game và chất lượng dữ liệu/save.
- Đối chiếu provenance giá; chốt EUR và EUR/tuần; thống kê thiếu dữ liệu trong báo cáo nội bộ.
- Viết test mapper và quy tắc giá trước; fixture tổng hợp, không đưa token/export production vào repo.
- Tạo exporter có quyền ở nguồn; không dùng API public làm bulk endpoint, không nới lockdown.

### B. Đồng bộ độc lập

- Chuẩn bị database catalog đích riêng nếu hiện tại chưa tách; không đổi database toàn site ngoài phạm vi đã duyệt.
- Thêm hai bảng, quyền tối thiểu và importer idempotent.
- Import thử vào staging, đối chiếu count/checksum/top 100/giá; chưa công bố khi không đạt.
- Thử lỗi chunk, timeout, retry, đồng bộ song song và rollback trước khi gắn UI.

### C. Module web tối giản

- Thêm server repository/DTO riêng cho players, API, trang danh sách và chi tiết.
- Reuse primitives đích; không copy module giao diện Trạm.
- Thêm mục Cầu thủ vào navigation desktop/mobile, không thay homepage hay checkout.
- Hoàn thiện search/filter/sort, loading/error/empty, metadata và ảnh fallback.

### D. Ra mắt

- Chạy kiểm thử, lint, typecheck, build và QA responsive.
- Bật module sau khi bản dữ liệu đầu tiên đã được duyệt.
- Theo dõi lỗi đồng bộ, lượng dòng và độ phủ giá ở khu vận hành; giữ bản active cũ khi lỗi.

### Vị trí code dự kiến, chưa tạo trong bước blueprint

```text
app/cau-thu/page.tsx
app/cau-thu/[slug]/page.tsx
app/cau-thu/loading.tsx
app/cau-thu/error.tsx
app/cau-thu/components/
app/cau-thu/players.module.css
app/api/cau-thu/route.ts
app/api/cau-thu/bo-loc/route.ts
lib/players/types.ts
lib/players/normalize.ts
lib/players/pricing.ts
lib/server/players.ts
scripts/import-player-catalog.mjs
supabase/migrations/<timestamp>_player_catalog.sql
tests/player-pricing.test.ts
tests/player-catalog.test.ts
```

Các đường dẫn trên là đề xuất, không phải file có sẵn. Exporter thuộc project nguồn và phải được duyệt riêng. Không thêm framework/UI library/queue mới khi stack hiện tại đủ dùng. Giữ thay đổi trong module mới và mục nav, không refactor auth/payment/mod catalog.

## 12. Tiêu chí nghiệm thu

### Dữ liệu và tài chính

- [ ] Số cầu thủ active khớp manifest được phê duyệt, không giới hạn ngầm 1.000 dòng.
- [ ] Không mất cầu thủ do thiếu ảnh/giá/lương; game version không bị đổi nhãn.
- [ ] Có market hợp lệ thì ưu tiên market; thiếu market thì Career đã xác minh; thiếu cả hai thì null.
- [ ] Không nhận nhầm giá thị trường thành Career chỉ vì provenance thiếu.
- [ ] Top 100 được chọn toàn tập bằng POT/OVR/ID, không theo page/filter/giới tính hay tình trạng có giá.
- [ ] Test đủ hơn 100 người, POT trùng, POT null, dưới 100 người và top 100 thiếu giá.
- [ ] Tăng đúng 10%, làm tròn thống nhất, retry không tăng lũy tiến; người thứ 101 giữ nguyên.
- [ ] Giá được lọc/sort theo số sau tăng; null nằm cuối; lương không đổi.
- [ ] Ngày định giá không bị đổi thành ngày sync; lương hiển thị EUR/tuần và đúng bản chất trong game.
- [ ] UI có chú thích điều chỉnh; không gọi giá sau tăng là market nguyên bản.

### An toàn và vận hành

- [ ] Không thay policy nguồn, không sao chép dữ liệu người dùng hoặc khóa nguồn.
- [ ] Website chạy được với bản active khi nguồn/export tạm ngừng.
- [ ] Import thiếu chunk/checksum sai/ID trùng không được kích hoạt.
- [ ] Kích hoạt và rollback nguyên tử; không làm mất catalog khi retry hoặc chạy đồng thời.
- [ ] Public DTO không có trường ngoài allowlist, manifest hay export credentials.
- [ ] Quyền runtime/import/anon được kiểm tra riêng; không chỉ dựa vào server-side naming.
- [ ] Không lộ request/media URL nội bộ Trạm qua browser; nguồn bên thứ ba được ghi công đúng yêu cầu.

### UX và hồi quy

- [ ] Search không dấu, lọc khoảng tiền, sort và Back/Forward hoạt động.
- [ ] Loading/lỗi/rỗng/404 phân biệt đúng; lỗi dữ liệu không thành 404 giả.
- [ ] Giá và lương đều đọc được ở 320/375/768/1280/1440px.
- [ ] Không có công cụ/nhận xét đặc trưng Trạm; không lộ nhãn kỹ thuật trên UI.
- [ ] Auth, mua game, mod, credit và navigation cũ vẫn hoạt động.

Lệnh kiểm tra khi có triển khai tại đích: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. `package.json` đã có scripts test/lint/build; Vitest chạy `tests/**/*.test.ts`. QA trình duyệt và kiểm Network bổ sung cho test tự động. Các bước này là kế hoạch nghiệm thu, chưa được chạy cho tính năng chưa triển khai.

## 13. Tóm tắt để giao triển khai

> Xây module tra cứu cầu thủ riêng cho DungDiBinhLuan bằng Next.js hiện tại. Đồng bộ một chiều qua gói export có cấp quyền; giữ database catalog riêng, không gọi Trạm từ browser. Lấy đủ cầu thủ và chỉ các trường cần thiết. Giá ưu tiên thị trường, thiếu thì Career đã xác minh; top 100 POT toàn tập tăng 10%, lương giữ nguyên. UI gồm danh sách có tìm/lọc và chi tiết gọn, dùng token/font DungDiBinhLuan. Hiển thị giá sau điều chỉnh là Giá tham khảo, nêu cơ sở và điều chỉnh ở chi tiết. Không chuyển công cụ, nội dung riêng hay dữ liệu người dùng của Trạm. Không cam kết che giấu được nguồn dữ liệu hoặc chủ sở hữu.
