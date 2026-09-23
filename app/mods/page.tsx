import type { Metadata } from "next";
import { listModsPublic } from "@/lib/server/mods";
import { getCreditPricesMap } from "@/lib/server/credit";
import type { DbModRecord } from "@/lib/catalog";
import ModsClient from "./ModsClient";

export const metadata: Metadata = {
  title: "Kho mod FC 26",
  description: "Kho mod FC 26 chất lượng cao — Faces, Kits, Gameplay, Đồ họa 4K được tuyển chọn bởi DungDiBinhLuan.",
  alternates: {
    canonical: "https://dungdibinhluan.com/mods",
  },
  openGraph: {
    title: "Kho mod FC 26 | DungDiBinhLuan",
    description: "Kho mod FC 26 chất lượng cao — Faces, Kits, Gameplay, Đồ họa 4K.",
    images: [{ url: "/og-image.jpg" }],
  },
};

// 300s: đủ tươi để admin bật/tắt credit phản ánh nhanh, vẫn cache tốt cho CDN.
export const revalidate = 300;

export default async function ModsPage() {
  // Chỉ lấy các cột cần cho card (bỏ long_description nặng) + giá credit trong 1 lượt song song
  const [{ data }, prices] = await Promise.all([
    listModsPublic(),
    getCreditPricesMap(),
  ]);

  // Gắn credit_cost và che download_url của mod yêu cầu credit (đồng bộ với /api/mods,
  // tránh leak link tải sau paywall qua payload SSR).
  // Adapter trong lib/catalog dùng download_url != null để phân loại offer
  // (free vs contact) — mod bị khóa credit luôn resolve sang credit trước.
  const mods: DbModRecord[] = (data ?? []).map((m) => {
    const cost = prices[m.id as string];
    const isLocked = cost != null;
    return {
      id: m.id as string,
      slug: m.slug as string,
      name: m.name as string,
      author: m.author as string,
      category: m.category as string,
      version: m.version as string,
      updated_at: m.updated_at as string,
      description: (m.description as string | null) ?? null,
      long_description: null,
      thumbnail: (m.thumbnail as string | null) ?? null,
      download_url: isLocked ? null : ((m.download_url as string | null) ?? null),
      tags: (m.tags as string[] | null) ?? [],
      thumbnail_orientation: (m.thumbnail_orientation as string) ?? "portrait",
      featured: Boolean(m.featured),
      video_id: (m.video_id as string | null) ?? null,
      created_at: m.created_at as string,
      credit_cost: cost ?? null,
    };
  });

  return <ModsClient initialDbMods={mods} />;
}
