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
  /**
   * Danh sách file tải được sau khi nhập mã — MỘT nguồn dung lượng duy nhất
   * (§12.4: không hardcode "~57GB" riêng ở từng trang tải).
   * `size`/`version` chỉ điền khi đã xác nhận — không bịa con số.
   */
  files?: GameFile[];
};

export type GameFile = {
  /** id ổn định để quản trạng thái từng file (idle/creating/ready/error) */
  id: string;
  name: string;
  /** Loại nội dung: "File cài đặt game", "Gói mod", "Công cụ cài đặt"... */
  kind: string;
  /** Dung lượng ĐÃ XÁC NHẬN — để trống nếu chưa đo được */
  size?: string;
  /** Phiên bản ĐÃ XÁC NHẬN — để trống nếu chưa rõ */
  version?: string;
  /** Endpoint trả presigned URL { url } hoặc { error } */
  endpoint:
    | "/api/download"
    | "/api/download-mods"
    | "/api/download-tool"
    | "/api/download-fc27";
  /** true = chỉ bản Full Mods mới có quyền tải file này */
  modsOnly?: boolean;
  /** Ghi chú/hướng dẫn ngắn hiển thị ngay trên file card */
  note?: string;
};

export const FC26_GAME_SIZE = "~57 GB";

export const GAMES: Game[] = [
  {
    slug: "fc27",
    name: "EA FC 27",
    subtitle: "LAUNCH EDITION",
    description: "Mùa giải mới đã chính thức bắt đầu.",
    tag: "MỚI RA MẮT",
    spotlight: true,
    hasDownload: true,
    passSum: 16,
    fileFormat: "RAR",
    thumbnail: "/games/fc27/fc27-city.webp",
    coverColor: "var(--color-accent)",
    files: [
      {
        id: "fc27-setup",
        name: "EA FC 27 — Bộ cài đặt",
        kind: "File cài đặt game",
        version: "FC 27",
        endpoint: "/api/download-fc27",
        note: "Link tải có hiệu lực trong một giờ. Nên dùng IDM hoặc Neat Download Manager để tải file lớn ổn định hơn.",
      },
      {
        id: "fc27-client-tool",
        name: "ClientTool DungDiBinhLuan",
        kind: "Công cụ hỗ trợ cài đặt",
        endpoint: "/api/download-tool",
        note: "Công cụ hỗ trợ giải nén và cài đặt — làm theo video hướng dẫn trên trang.",
      },
    ],
  },
  {
    slug: "fc26",
    name: "EA FC 26",
    subtitle: "ALL IN ONE GAME SET UP",
    description: "Bộ cài đặt đầy đủ, sẵn sàng chơi ngay.",
    tag: "🔥 HOT",
    spotlight: true,
    hasDownload: true,
    passSum: 15,
    fileSize: FC26_GAME_SIZE,
    fileFormat: "RAR",
    coverColor: "var(--color-accent)",
    files: [
      {
        id: "fc26-setup",
        name: "EA FC 26 — Bộ cài đặt",
        kind: "File cài đặt game",
        size: FC26_GAME_SIZE,
        version: "FC 26",
        endpoint: "/api/download",
        note: "File nén RAR — nên tải bằng IDM/Neat Download Manager để tránh lỗi giữa chừng.",
      },
      {
        id: "fc26-mods-pack",
        name: "FC 26 Full Mods Pack",
        kind: "Gói mod",
        endpoint: "/api/download-mods",
        modsOnly: true,
        note: "Faces, kits, đồ họa và gameplay — chỉ dành cho bản Full Mods Edition.",
      },
      {
        id: "fc26-client-tool",
        name: "ClientTool DungDiBinhLuan",
        kind: "Công cụ hỗ trợ cài đặt",
        endpoint: "/api/download-tool",
        note: "Công cụ giải nén và cài đặt — làm theo video hướng dẫn bên dưới.",
      },
    ],
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
