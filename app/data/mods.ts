export type Mod = {
  slug: string;
  name: string;
  author: string;
  category: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  images: string[];
  downloadUrl: string;
  likes: number;
  downloads: number;
  tags: string[];
  featured?: boolean;
  version: string;
  updatedAt: string;
  thumbnailOrientation?: "portrait" | "landscape";
};

export const MODS: Mod[] = [
  {
    slug: "mix-mods-fc26",
    name: "MIX MODS FC 26 2025–2026",
    author: "DungDiBinhLuan",
    category: "All-in-One",
    version: "v1.0",
    updatedAt: "11/03/2026",
    description: "Bộ mod tổng hợp hoàn chỉnh nhất thị trường — Faces, Kits, Gameplay, Đồ họa 4K.",
    longDescription: `Siêu phẩm MIX MODS FC 26 đã chính thức ra mắt! Bản mod hoàn thiện nhất trên thị trường với hàng trăm mod mất phí được chọn lọc kĩ càng.

Bao gồm facepack lớn nhất, áo đấu mùa 2025-26, gameplay AI được cải thiện, đồ họa 4K UltraHD và hàng trăm cập nhật khác.`,
    thumbnail: "/mods/mixmods.jpg",
    images: ["/mods/mixmods.jpg", "/mods/mix-mods-2.jpg"],
    downloadUrl: "https://drive.google.com/file/d/1jP39z0kHDmB7XOLB8c682mpTxBOklXVW/view?usp=sharing",
    likes: 128,
    downloads: 1240,
    tags: ["Faces", "Kits", "Gameplay", "Đồ họa", "Cơ chế game"],
    featured: true,
  },

  

{
  slug: "brx15",
  name: "BxR Mods V8.0",
  author: "BxR",
  category: "Kits",
  version: "TU 1.5.0",
  updatedAt: "12/03/2026",
  description: "Update giày dép, găng tay, bóng và hình xăm mới nhất cho FC 26",
  longDescription: `BxR Mods V8.0 (TU 1.5.0)

Đã thêm 477 đôi giày.

Đã thêm 128 đôi găng tay.

Đã thêm 118 quả bóng.

Đã thêm hơn 30 hình xăm.`,
  thumbnail: "/mods/brx15.jpg",
  images: [],
  downloadUrl: "https://modsfire.com/download/8tn5968AG6WW0Pc/32315",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Kits"],
  featured: false,
},

{
  slug: "esim150",
  name: "eSIM Mod 1.9.1",
  author: "eSIM",
  category: "Đồ họa",
  version: "TU 1.5.0",
  updatedAt: "12/03/2026",
  description: "Bản eSim cho update 1.5.0",
  longDescription: `Bản eSim cho update 1.5.0`,
  thumbnail: "/mods/esim.jpg",
  images: [],
  downloadUrl: "https://drive.google.com/file/d/1et-Extmt2i2Y7pPrjDvvWE5Jpv3vav8w/view?usp=sharing",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "landscape",
  tags: ["Đồ họa"],
  featured: false,
},

{
  slug: "rode150",
  name: "RODE's Kit Expansion Mod Beta 11.0",
  author: "RODE",
  category: "Kits",
  version: "TU 1.5.0",
  updatedAt: "12/03/2026",
  description: "Bản update quần áo đầy  cho update 1.5.0",
  longDescription: `RODE's Kit Expansion Mod Beta 11 (Dành cho bản cập nhật TU 1.5.0)

Tương thích hoàn toàn với FIFER's Mod.

Tương thích hoàn toàn với các bản mod của KIARIKA.

Đã thêm bộ trang phục thi đấu thứ 3 (Third kits).

Mở khóa bản quyền (License) cho các đội bóng Serie A.

Thêm bộ trang phục World Cup 2026 cho các đội tuyển quốc gia.

Thêm các mẫu áo đặc biệt đóng vai trò là bộ trang phục thứ 4.

Thêm font số áo đấu dành riêng cho các giải cúp (Cup fonts).

Thêm logo World Cup (WC badge) lên áo đấu của Chelsea.

Sửa các lỗi (Bugs) còn tồn đọng.`,
  thumbnail: "/mods/rodek.jpg",
  images: [],
  downloadUrl: "https://drive.google.com/file/d/1LoD0Fh2i8aAPyDxiEjRePYxO37ix6Sxu/view?usp=sharing",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "landscape",
  tags: ["Kits"],
  featured: false,
},

{
  slug: "fifer150",
  name: "FIFER's FC26 Realism Mod 1.0 Alpha 14 TU 1.5.0",
  author: "FIFER",
  category: "Faces",
  version: "TU 1.5.0",
  updatedAt: "12/03/2026",
  description: "Bản FIFER cho update 1.5.0",
  longDescription: `Bản FIFER cho update 1.5.0`,
  thumbnail: "/mods/fifer.jpg",
  images: [],
  downloadUrl: "https://drive.google.com/file/d/1C9tmI33yNgDRYlFD7-K_PiiJwkojVv75/view?usp=sharing",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "landscape",
  tags: ["Faces"],
  featured: false,
},



{
  slug: "fifaman",
  name: "FC 26 FIFAMAN Realism Mod V1",
  author: "FIFAMAN",
  category: "Cơ chế game",
  version: "TU 1.5.0",
  updatedAt: "12/03/2026",
  description: "Update hệ thống game trong FC ",
  longDescription: `FC 26 FIFAMAN Realism Mod V1 (TU 1.5.0)
"Biến Career Mode thành một thử thách quản lý thực thụ"

Hệ thống Scout 2.0: Nâng cấp cấu trúc tuyển trạch với chi phí thực tế (Scout 5★ lên tới €25M). Chỉ những CLB lớn mới đủ sức vận hành học viện đỉnh cao.

Học viện thực tế: Mở rộng độ tuổi (12–20 tuổi) và giới hạn tỉ lệ xuất hiện Wonderkid (Platinum chỉ 0–1%). Tìm thấy một "tiểu Messi" giờ đây là cả một hành trình.

Phát triển cầu thủ: Tốc độ tăng chỉ số chậm hơn 30%, yêu cầu sự kiên nhẫn và chiến thuật đào tạo dài hạn.

Thị trường chuyển nhượng "Gắt": AI thông minh hơn trong đàm phán, ưu tiên lòng trung thành và các điều khoản giải phóng hợp đồng phức tạp.

Tương thích: Hoàn hảo cho bản cập nhật TU 1.5.0.`,
  thumbnail: "/mods/fifaman.jpg",
  images: [],
  downloadUrl: "https://drive.google.com/file/d/1y1BJXIqXBkL6KVOjFBCJ-sdzNpSQTRZD/view?usp=sharing",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Cơ chế game"],
  featured: false,
},
{
  slug: "art150",
  name: "FC 26 Artisan Bootpack V39.0.1 TU 1.5.0",
  author: "Artisan",
  category: "Kits",
  version: "TU 1.5.0",
  updatedAt: "12/03/2026",
  description: "Đây là gói giày (Bootpack) trả phí có quy mô lớn nhất dành cho FC 26",
  longDescription: `FC 26 Artisan Bootpack V39.0.1 – "Siêu tủ giày" lớn nhất cho FC 26

Số lượng cực khủng: Bổ sung hơn 940+ mẫu giày từ các thương hiệu hàng đầu, đa dạng mẫu mã và màu sắc.

Chất lượng Premium: Đây là bản Bootpack trả phí được tối ưu hóa cực tốt về hình ảnh, đảm bảo độ chi tiết cao nhất trên sân cỏ.

Tương thích hoàn hảo: Hoạt động ổn định trên phiên bản TU 1.5.0.`,
  thumbnail: "/mods/art150.jpg",
  images: [],
  downloadUrl: "https://drive.google.com/file/d/11l2P3N14Jkg8NqRFaRTwDqFzX0dPvNhM/view?usp=sharing",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "landscape",
  tags: ["Kits"],
  featured: false,
},


];
