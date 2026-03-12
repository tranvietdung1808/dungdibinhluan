import { MetadataRoute } from "next";
import { MODS } from "./data/mods";

export default function sitemap(): MetadataRoute.Sitemap {
  const modUrls = MODS.map((mod) => ({
    url: `https://dungdibinhluan.com/mods/${mod.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://dungdibinhluan.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://dungdibinhluan.com/mods",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...modUrls,
  ];
}
