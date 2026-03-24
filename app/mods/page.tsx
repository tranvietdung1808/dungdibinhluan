import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ModsClient from "./ModsClient";

export const metadata: Metadata = {
  title: "Mod Hub",
  description: "Kho mod FC 26 chất lượng cao — Faces, Kits, Gameplay, Đồ họa 4K được tuyển chọn bởi DungDiBinhLuan.",
  openGraph: {
    title: "Mod Hub | DungDiBinhLuan",
    description: "Kho mod FC 26 chất lượng cao — Faces, Kits, Gameplay, Đồ họa 4K.",
    images: [{ url: "/og-image.jpg" }],
  },
};

export const revalidate = 120;

export default async function ModsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("mods")
    .select("*")
    .order("created_at", { ascending: false });

  return <ModsClient initialDbMods={(data || []) as any[]} />;
}
