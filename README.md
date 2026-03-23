# ⚽ DungDiBinhLuan - Mod Hub cho EA FC 26

> **Trang chia sẻ mod miễn phí cho cộng đồng EA FC 26 Việt Nam**

Website: [dungdibinhluan.com](https://dungdibinhluan.com)

---

## 🎮 Giới thiệu

DungDiBinhLuan là nơi anh em game thủ EA FC 26 có thể:

- **Tải mod miễn phí** - Faces, Kits, Gameplay, Graphics...
- **Cập nhật thường xuyên** - Mod mới mỗi tuần
- **Giao diện đẹp** - Thiết kế hiện đại, tối ưu cho cả mobile lẫn desktop

---

## 🚀 Tính năng

### 📦 Mod Hub
- Danh sách mod với thumbnail đẹp mắt
- Phân loại theo category: Faces, Kits, Gameplay, Đồ họa...
- Tìm kiếm và lọc dễ dàng

### 👤 Face Mods (Special Layout)
- Layout riêng cho face mod với ảnh portrait
- Background gradient + vignette đẹp mắt
- Thông tin chi tiết + nút download nổi bật

### 💳 Mix Mods FC26
- Gói mod trả phí với 169.000đ
- Hỗ trợ update miễn phí trọn đời
- Liên hệ mua qua Zalo

### 🔧 Admin Panel
- Quản lý mod, face
- Upload file lên S3
- Analytics & tracking

---

## 🛠️ Tech Stack

| Công nghệ | Mô tả |
|-----------|-------|
| **Next.js 16** | Framework React với App Router |
| **TypeScript** | Type-safe code |
| **Tailwind CSS 4** | Styling nhanh gọn |
| **AWS S3** | Lưu trữ file mod |
| **Upstash Redis** | Cache & rate limiting |
| **Vercel Analytics** | Theo dõi traffic |

---

## 📁 Cấu trúc thư mục

```
app/
├── admin/          # Trang admin quản lý
├── api/            # API routes (download, upload...)
├── components/     # React components tái sử dụng
├── data/           # Data files (mods.ts, faces.ts, games.ts)
├── dmca/           # Trang DMCA policy
├── games/          # Trang mua game FC26
├── mods/           # Trang chi tiết từng mod
│   └── [slug]/     # Dynamic route cho mod detail
├── page.tsx        # Trang chủ
├── layout.tsx      # Root layout
└── sitemap.ts      # SEO sitemap
```

---

## 🏃 Chạy local

```bash
# Clone repo
git clone https://github.com/tranvietdung1808/dungdibinhluan.git

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Mở [http://localhost:5000](http://localhost:5000) để xem.

---

## 🌿 Environment Variables

Tạo file `.env.local` với:

```env
# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## 📝 Thêm mod mới

### Thêm Face mod

Mở `app/data/faces.ts`:

```typescript
{
  slug: "face-ten-cau-thu",
  name: "Face Tên Cầu Thủ",
  description: "Mô tả ngắn",
  longDescription: "Mô tả chi tiết...",
  thumbnail: "/mods/anh-thumb.jpg",
  downloadUrl: "https://s3.../file.exe",
  author: "Tên tác giả",
  version: "1.0",
  updatedAt: "24/03/2026",
  category: "Faces",
  tags: ["Faces"],
  featured: false,
  thumbnailOrientation: "portrait", // Quan trọng!
}
```

### Thêm Mod thường

Mở `app/data/mods.ts`:

```typescript
{
  slug: "ten-mod",
  name: "Tên Mod",
  // ... tương tự nhưng không cần thumbnailOrientation
}
```

---

## 🎨 Layout tự động

Website tự động chọn layout dựa trên loại mod:

- **Faces** (`thumbnailOrientation: "portrait"`) → Layout 2 cột với ảnh portrait lớn
- **Mod thường** → Layout hero banner full-width

---

## 📱 Responsive

- Mobile-first design
- Tối ưu cho mọi kích thước màn hình
- Touch-friendly buttons

---

## 🔒 DMCA

Chúng tôi tôn trọng bản quyền. Nếu mod của bạn bị đăng mà không được xin phép, hãy liên hệ qua [trang DMCA](https://dungdibinhluan.com/dmca).

---

## 🤝 Đóng góp

Fork → Tạo branch → Commit → Push → Tạo PR

---

## 📞 Liên hệ

- **Website**: [dungdibinhluan.com](https://dungdibinhluan.com)
- **Facebook**: [Page DungDiBinhLuan](https://facebook.com/dungdibinhluan)
- **Zalo**: Liên hệ qua website

---

## 📜 License

MIT License - Tự do sử dụng và chỉnh sửa

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/tranvietdung1808">tranvietdung1808</a>
</p>
