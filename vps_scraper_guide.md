# Hướng Dẫn Cài Đặt Scraper Lên VPS Windows (Chạy Tự Động 2 Tiếng 1 Lần)

Tài liệu này hướng dẫn bạn cách cài đặt và cấu hình tool cào dữ liệu lên **VPS Windows** của bạn.

---

## Bước 1: Tải và cài đặt Node.js trên VPS Windows

1. Truy cập trang chủ Node.js bằng trình duyệt trên VPS: [https://nodejs.org](https://nodejs.org)
2. Tải bản **LTS mới nhất** (thường là Node 20 hoặc Node 22).
3. Mở file vừa tải về và bấm **Next -> Next -> Finish** để cài đặt.

Để kiểm tra cài đặt thành công chưa:
- Mở **Command Prompt (CMD)** hoặc **PowerShell**.
- Gõ: `node -v` và `npm -v`. Nếu hiện ra phiên bản là đã xong.

---

## Bước 2: Tạo thư mục chứa Tool trên VPS

1. Tạo một thư mục mới tại ổ `C:\`, ví dụ: `C:\gamekot-scraper`.
2. Tạo file `scraper.js` bên trong thư mục này và dán toàn bộ code của tool vào.
3. Tạo file `.env.local` bên trong thư mục này và dán nội dung sau:

```env
NEXT_PUBLIC_SUPABASE_URL="https://ppyhxsprmebkudevgwql.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="MÃ_SERVICE_ROLE_KEY_CỦA_BẠN"

R2_ENDPOINT="https://68fdc842d5aee7af2334d94480e7a761.r2.cloudflarestorage.com"
R2_BUCKET_NAME="dungdibinhluan-images"
ACCESS_KEY_ID="b45d6d31a827f327810a07b94a72382b"
SECRET_ACCESS_KEY="7c6359304641467dd06d8cdd0b717ad2b940d9387c350991e3200ab9cc73eead"
```

---

## Bước 3: Cài đặt các thư viện cần thiết

1. Mở **Command Prompt (CMD)** hoặc **PowerShell**.
2. Gõ lệnh để di chuyển vào thư mục tool:
   ```cmd
   cd C:\gamekot-scraper
   ```
3. Cài đặt các thư viện bằng lệnh:
   ```cmd
   npm install dotenv @supabase/supabase-js @aws-sdk/client-s3 cheerio
   ```

---

## Bước 4: Chạy thử nghiệm

```cmd
node scraper.js
```
Nếu màn hình hiện thông báo cào và lưu thành công là tool đã chạy mượt mà.

---

## Bước 5: Tạo lịch tự động chạy 2 tiếng / lần (Task Scheduler)

Trên Windows, chúng ta dùng **Task Scheduler** thay cho cronjob:

1. Bấm phím `Windows`, gõ tìm kiếm **Task Scheduler** và mở nó lên.
2. Tại cột bên phải, chọn **Create Basic Task...**
3. **Name**: Gõ `Gamekot Scraper`. Bấm **Next**.
4. **Trigger**: Chọn **Daily** (Hàng ngày). Bấm **Next**.
5. **Start time**: Để mặc định giờ hiện tại. Bấm **Next**.
6. **Action**: Chọn **Start a program**. Bấm **Next**.
7. Tại ô **Program/script**: Gõ `node` hoặc đường dẫn đầy đủ đến node (ví dụ: `C:\Program Files\nodejs\node.exe`).
8. Tại ô **Add arguments**: Gõ `scraper.js`.
9. Tại ô **Start in (optional)**: Gõ `C:\gamekot-scraper`.
10. Bấm **Next** -> Bấm **Finish**.

### Để chỉnh cho Task chạy 2 tiếng 1 lần:
1. Tìm task `Gamekot Scraper` bạn vừa tạo trong danh sách, **nhấp đúp chuột** vào nó để mở thuộc tính.
2. Chuyển sang thẻ **Triggers**.
3. Chọn dòng trigger Daily và bấm **Edit...**
4. Đánh dấu tích vào ô **Repeat task every:** và chọn (hoặc gõ) **2 hours**.
5. Ô **for a duration of:** chọn **Indefinitely** (Vô thời hạn).
6. Bấm **OK** -> **OK** để lưu lại.

---
Từ bây giờ, cứ mỗi 2 tiếng Task Scheduler sẽ tự động mở lên chạy tool cào bài mới cho bạn hoàn toàn tự động!
