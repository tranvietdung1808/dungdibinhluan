import { MetadataRoute } from "next";
import { MODS } from "./data/mods";
import { FACES } from "./data/faces";
import { GAMES } from "./data/games";
import { supabaseAdmin } from "@/lib/supabase";

const parseDate = (str: string) => {
  try {
    const [day, month, year] = str.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return new Date();
    return date;
  } catch {
    return new Date();
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic entities from DB
  const { data: dbMods } = await supabaseAdmin.from("mods").select("slug, updated_at");
  const { data: dbGuides } = await supabaseAdmin.from("guides").select("slug, updated_at");

  const staticModsUrls = [...MODS, ...FACES].map((mod) => ({
    url: `https://dungdibinhluan.com/mods/${mod.slug}`,
    lastModified: parseDate(mod.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const dynamicModsUrls = (dbMods || []).map((mod) => {
    // Some mods in DB might have updated_at as ISO string or DD/MM/YYYY text
    const dateStr = mod.updated_at || "";
    const dateObj = dateStr.includes("/") ? parseDate(dateStr) : new Date(dateStr);
    return {
      url: `https://dungdibinhluan.com/mods/${mod.slug}`,
      lastModified: isNaN(dateObj.getTime()) ? new Date() : dateObj,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  const guideUrls = (dbGuides || []).map((guide) => {
    const dateObj = new Date(guide.updated_at || "");
    return {
      url: `https://dungdibinhluan.com/huong-dan/${guide.slug}`,
      lastModified: isNaN(dateObj.getTime()) ? new Date() : dateObj,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  const games = GAMES.map((game) => ({
    url: `https://dungdibinhluan.com/games/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: "https://dungdibinhluan.com",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: "https://dungdibinhluan.com/mods",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: "https://dungdibinhluan.com/games",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: "https://dungdibinhluan.com/huong-dan",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: "https://dungdibinhluan.com/dmca",
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    ...games,
    ...staticModsUrls,
    ...dynamicModsUrls,
    ...guideUrls,
  ];
}
