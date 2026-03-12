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
    thumbnail: "/mods/mix-mods-thumb.jpg",
    images: ["/mods/mix-mods-1.jpg", "/mods/mix-mods-2.jpg"],
    downloadUrl: "https://drive.google.com/file/d/1jP39z0kHDmB7XOLB8c682mpTxBOklXVW/view?usp=sharing",
    likes: 128,
    downloads: 1240,
    tags: ["Faces", "Kits", "Gameplay", "Đồ họa", "Cơ chế game"],
    featured: true,
  },

  {
  slug: "griezmann-update-face",
  name: "Antoine Griezmann Update Face",
  author: "Facemaker",
  category: "Faces",
  version: "v1.0",
  updatedAt: "12/03/2026",
  description: "Update facemod Antoine Griezmann",
  longDescription: `Faces lẻ của Antoine Griezmann dành cho FC 26`,
  thumbnail: "/mods/grz1.jpg",
  images: [],
  downloadUrl: "https://pixeldrain.com/u/ramq2dse",
  likes: 0,
  downloads: 0,
  thumbnailOrientation: "portrait",
  tags: ["Faces"],
  featured: false,
},

];
