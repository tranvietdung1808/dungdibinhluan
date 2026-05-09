import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import ModsClient from "./ModsClient";
import type { Database } from "@/utils/supabase/database.types";

type ModRow = Database["public"]["Tables"]["mods"]["Row"];

export const metadata: Metadata = {
  title: "Mod Hub - Kho Mod Miễn Phí",
  description: "Kho mod FC 26 miễn phí — Faces, Kits, Gameplay, Đồ họa 4K được chia sẻ bởi DungDiBinhLuan.",
  alternates: {
    canonical: "https://dungdibinhluan.com/mods",
  },
  openGraph: {
    title: "Mod Hub - Kho Mod Miễn Phí | DungDiBinhLuan",
    description: "Kho mod FC 26 miễn phí — Faces, Kits, Gameplay, Đồ họa 4K.",
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

  return <ModsClient initialDbMods={(data || []) as ModRow[]} />;
}
