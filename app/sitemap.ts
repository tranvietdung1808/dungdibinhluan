import { MetadataRoute } from "next";
import { MODS } from "./data/mods";
import { FACES } from "./data/faces";

const parseDate = (str: string) => {
  try {
    const [day, month, year] = str.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    // Kiểm tra date hợp lệ trước khi dùng
    if (isNaN(date.getTime())) return new Date();
    return date;
  } catch {
    return new Date();
  }
};

export default function sitemap(): MetadataRoute.Sitemap {
  const mods = [...MODS, ...FACES].map((mod) => ({
    url: `https://dungdibinhluan.com/mods/${mod.slug}`,
    lastModified: parseDate(mod.updatedAt),
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
    ...mods,
  ];
}
