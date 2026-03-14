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

{
  slug: "aimotion150",
  name: "AI MOTION 10.0 TU 1.5.0",
  author: "Cheng",
  category: "Gameplay",
  version: "TU 1.5.0",
  updatedAt: "13/03/2026",
  description: "Một bản Mod gameplay có phong cách khá độc đáo và riêng biệt đến từ các pháp sư modder Hàn Quốc",
  longDescription: `Một bản Mod gameplay có phong cách khá độc đáo và riêng biệt đến từ các "pháp sư" modder Hàn Quốc, 
  với những cải tiến đáng chú ý về chuyển động của cầu thủ, AI thông minh hơn và phản ứng nhanh hơn trên sân cỏ. Bản mod này hứa hẹn mang đến trải nghiệm chơi game mượt mà và thực tế hơn cho người chơi FC 26.`,
  thumbnail: "/mods/aimotion.jpg",
  images: [],
  downloadUrl: "https://pixeldrain.com/u/Bok1fhYV",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Gameplay"],
  featured: false,
},
{
  slug: "kit1",
  name: "26-27 AIO KitPack Mod V1 FC26",
  author: "ViP3eR",
  category: "Kits",
  version: "TU 1.5.0",
  updatedAt: "13/03/2026",
  description: "Cập nhật tương lai: Hơn 100+ bộ kit mới nhất mùa giải 26/27 và bộ sưu tập áo đấu World Cup 2026 cực hot",
  longDescription: `26-27 AIO KitPack Mod V1 FC26 By ViP3eR (Dành cho TU 1.5.0)

Đã thêm hơn 100 bộ trang phục thi đấu của mùa giải 26/27.

Đã thêm áo đấu cho World Cup 2026.

Mở khóa bản quyền (License) hoàn toàn cho các đội bóng Serie A.

Thêm băng rôn và cờ cổ vũ cho các đội Serie A đã được cấp bản quyền.

Tính năng bổ sung: Cho phép bắt đầu chế độ sự nghiệp (Career Mode) từ năm 2026.

Mod có thể kết hợp với Facepack và các gói Kit khác. Để đồng bộ, hãy sử dụng tệp Squads trong thư mục: 26-27 AIO V1 x Ultimate AIO V5 x FacePack V5.`,
  thumbnail: "/mods/kit1.jpg",
  images: [],
  downloadUrl: "https://pixeldrain.com/u/VV561EGT",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Kits"],
  featured: false,
},
{
  slug: "gvsx150",
  name: "GVSX Mod TU 1.5.0",
  author: "GVSX",
  category: "Đồ họa",
  version: "TU 1.5.0",
  updatedAt: "13/03/2026",
  description: "GVSX Mod là một cuộc đại tu toàn diện về mặt thị giác và cảm giác chơi, đặc biệt là cực kỳ chi tiết ở mảng vật lý lưới và giải VĐQG Brazil",
  longDescription: `Hệ thống lưới (Nets) siêu thực: * Nhiều kiểu dáng: Lưới chữ nhật (căng, lỏng, cong), lưới kiểu "voan cô dâu" (Bridal Veil), lưới BOX, và lưới lấy cảm hứng từ PES 2011.

Có 3 độ sâu: Dài, Thường, và Ngắn cho mỗi loại.

Mặt cỏ (Grasses): Cỏ tự nhiên 4K siêu nét, cỏ nhân tạo, cỏ tiêu chuẩn châu Âu và addon tăng độ cao cỏ.

Ánh sáng (Lighting): 3 chế độ ánh sáng khác nhau cho mọi loại thời tiết (Sương mù, nắng ráo, mưa, tuyết...). Bóng đổ (shadows) được làm lại chân thực hơn.

Khán giả (Crowd): Mod khán giả siêu thực cho Career Mode hoặc tùy chọn xóa bỏ khán giả để tăng hiệu năng.

Trọng tài: Cập nhật đồng phục trọng tài giải Brazil 2026 và âm thanh còi mới.

Hiệu năng & Đồ họa: Tăng cường độ chi tiết (LOD) cả trong và ngoài sân; Mod tối ưu giúp tăng FPS.

Giao diện (HUD): Loại bỏ các chỉ báo rườm rà (vòng tròn dưới chân, điểm bóng rơi) để tăng tính trải nghiệm điện ảnh.

Âm thanh: Tiếng bóng đập lưới mới, nhạc ăn mừng bàn thắng (Goal Track) từ các nhà đài lớn (FOX Sports, Globo, TNT...).

Phụ kiện cầu thủ: Tất cực ngắn, băng tay, găng tay có thương hiệu thật, băng bảo vệ cổ chân.

Camera: Hệ thống camera tùy biến góc rộng; Camera mới cho đá phạt, penalty, phạt góc; Camera PRO lấy cảm hứng từ PES 2021.

Cá nhân hóa đội bóng: Hệ thống lưới riêng cho từng đội bóng Brazil (có logo, tên đội hoặc sọc màu đặc trưng của CLB đó trên lưới).`,
  thumbnail: "/mods/gvsx.jpg",
  images: [],
  downloadUrl: "https://pixeldrain.com/u/8esN9uJp",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Đồ họa"],
  featured: false,
},
{
  slug: "mnf1",
  name: "Better Regen Minifaces",
  author: "uNKNOWN",
  category: "Cơ chế game",
  version: "TU 1.5.0",
  updatedAt: "14/03/2026",
  description: "Bản mod này cải thiện hình ảnh đại diện (minifaces) của các cầu thủ trẻ trong học viện (Youth Academy) ",
  longDescription: `Better Regen Minifaces – Xóa tan nỗi lo "mặt nhựa" của cầu thủ trẻ

Cải thiện thẩm mỹ: Thay thế các hình ảnh đại diện mặc định thô cứng của cầu thủ trẻ (Regens) bằng những gương mặt tự nhiên và chân thực hơn.

Tăng tính trải nghiệm: Giúp chế độ Career Mode trở nên chuyên nghiệp hơn, khi các tài năng tương lai trong học viện có ngoại hình chỉn chu như cầu thủ thực thụ.

Tương thích hoàn hảo: Hoạt động ổn định trên phiên bản TU 1.5.0.

Nhẹ nhàng & Hiệu quả: Không gây nặng máy, dễ dàng kết hợp với các bản Mod gameplay hay đồ họa khác.`,
  thumbnail: "/mods/mnf1.jpg",
  images: [],
  downloadUrl: "https://pixeldrain.com/u/P224marX",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Cơ chế game"],
  featured: false,
},
{
  slug: "",
  name: "FC 26 - Live Editor v2.8",
  author: "xAranaktu",
  category: "Cơ chế game",
  version: "TU 1.5.0",
  updatedAt: "14/03/2026",
  description: "Live Editor là một công cụ mạnh mẽ cho phép người chơi chỉnh sửa trực tiếp dữ liệu trong game FC 26, từ chỉ số cầu thủ đến đội hình và chiến thuật, giúp tùy biến trải nghiệm chơi game theo ý muốn.",
  longDescription: `FC 26 - Live Editor v2.8 – Công cụ chỉnh sửa trực tiếp dữ liệu trong game

Cải thiện tính năng: Cho phép người chơi chỉnh sửa mọi aspect của game, từ chỉ số cầu thủ đến đội hình và chiến thuật.

Tăng tính tương tác: Giúp người chơi có thể tùy biến trải nghiệm chơi game theo ý muốn, tạo ra những phiên bản độc đáo của game.

Tương thích hoàn hảo: Hoạt động ổn định trên phiên bản TU 1.5.0.`,

  thumbnail: "/mods/LE.jpg",
  images: [],
  downloadUrl: "https://drive.google.com/file/d/13_wBjHXJZipFbrccRsvLDjJYV8mO5cfk/view?usp=sharing",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Cơ chế game"],
  featured: false,
},
{
  slug: "kotvlogo150",
  name: "TV Logo Pack TU 1.5.0",
  author: "KO",
  category: "Đồ họa",
  version: "TU 1.5.0",
  updatedAt: "14/03/2026",
  description: "TV Logo Pack là một bản mod đồ họa dành cho FC 26, bổ sung các logo truyền hình thực tế từ các nhà đài lớn như FOX Sports, Globo, TNT... giúp tăng tính chân thực và sống động cho trải nghiệm xem trận đấu trong game.",
  longDescription: `TV Logo Pack TU 1.5.0 – Bản mod bổ sung logo truyền hình thực tế cho FC 26`,
  thumbnail: "/mods/kotvlogo.jpg",
  images: [],
  downloadUrl: "https://pixeldrain.com/u/NjjhcKo4",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Đồ họa"],
  featured: false,
},

];
