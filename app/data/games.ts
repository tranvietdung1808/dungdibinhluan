export type Game = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  tag: string;
  spotlight: boolean;
  hasDownload: boolean;
  passSum: number;
  fileSize?: string;
  fileFormat?: string;
  coverColor: string;
  fbUrl?: string;
  thumbnail?: string; 
};


export const GAMES: Game[] = [
  {
    slug: "fc26",
    name: "EA FC 26",
    subtitle: "ALL IN ONE GAME SET UP",
    description: "Bộ cài đặt đầy đủ, sẵn sàng chơi ngay.",
    tag: "🔥 HOT",
    spotlight: true,
    hasDownload: true,
    passSum: 15,
    fileSize: "50 GB",
    fileFormat: "WINRAR",
    coverColor: "#ce5a67",
  },
  {
    slug: "fc25",
    name: "EA FC 25",
    subtitle: "FULL GAME + MOD",
    description: "Liên hệ để ADMIN hỗ trợ cài đặt.",
    tag: "AVAILABLE",
    spotlight: false,
    hasDownload: false,
    passSum: 14,
    thumbnail: "/games/fc25.jpg",
    coverColor: "#4a90d9",
    fbUrl: "https://web.facebook.com/dungbinhluan/",
  },
  {
    slug: "black-myth",
    name: "Black Myth: Wukong",
    subtitle: "FULL GAME SETUP",
    description: "Liên hệ để ADMIN hỗ trợ cài đặt.",
    tag: "AVAILABLE",
    spotlight: false,
    hasDownload: false,
    thumbnail: "/games/blmwk.jpg",
    passSum: 13,
    coverColor: "#d4a84b",
    fbUrl: "https://web.facebook.com/dungbinhluan/",
  },
];
