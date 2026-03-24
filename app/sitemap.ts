import { MetadataRoute } from "next";
import { MODS } from "./data/mods";
import { FACES } from "./data/faces";
import { GAMES } from "./data/games";
import { supabaseAdmin } from "@/lib/supabase";

const SITE_URL = "https://dungdibinhluan.com";
const BUILD_LASTMOD = new Date();
const SUPPORTED_GAME_SLUGS = new Set(["fc26"]);

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
  const { data: dbMods } = await supabaseAdmin.from("mods").select("slug, updated_at");
  const { data: dbGuides } = await supabaseAdmin.from("guides").select("slug, updated_at");

  const staticModsUrls = [...MODS, ...FACES].map((mod) => ({
    url: `${SITE_URL}/mods/${mod.slug}`,
    lastModified: parseDate(mod.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const dynamicModsUrls = (dbMods || []).map((mod) => {
    const dateStr = mod.updated_at || "";
    const dateObj = dateStr.includes("/") ? parseDate(dateStr) : new Date(dateStr);
    return {
      url: `${SITE_URL}/mods/${mod.slug}`,
      lastModified: isNaN(dateObj.getTime()) ? BUILD_LASTMOD : dateObj,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  const guideUrls = (dbGuides || []).map((guide) => {
    const dateObj = new Date(guide.updated_at || "");
    return {
      url: `${SITE_URL}/huong-dan/${guide.slug}`,
      lastModified: isNaN(dateObj.getTime()) ? BUILD_LASTMOD : dateObj,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  const games = GAMES.filter((game) => SUPPORTED_GAME_SLUGS.has(game.slug)).map((game) => ({
    url: `${SITE_URL}/games/${game.slug}`,
    lastModified: BUILD_LASTMOD,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: BUILD_LASTMOD,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/mods`,
      lastModified: BUILD_LASTMOD,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/huong-dan`,
      lastModified: BUILD_LASTMOD,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/dmca`,
      lastModified: BUILD_LASTMOD,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    ...games,
    ...staticModsUrls,
    ...dynamicModsUrls,
    ...guideUrls,
  ];
}
