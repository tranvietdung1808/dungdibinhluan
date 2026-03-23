import { MetadataRoute } from "next";
import { MODS } from "./data/mods";
import { FACES } from "./data/faces";

export default function sitemap(): MetadataRoute.Sitemap {
  const modUrls = MODS.filter((mod) => mod.slug).map((mod) => ({
    url: `https://dungdibinhluan.com/mods/${mod.slug}`,
    lastModified: new Date(mod.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const faceUrls = FACES.filter((face) => face.slug).map((face) => ({
    url: `https://dungdibinhluan.com/mods/${face.slug}`,
    lastModified: new Date(face.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://dungdibinhluan.com",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://dungdibinhluan.com/mods",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...modUrls,
    ...faceUrls,
  ];
}
