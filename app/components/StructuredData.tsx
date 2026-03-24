import { MODS } from "../data/mods";
import { FACES } from "../data/faces";

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

export default function StructuredData() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DungDiBinhLuan",
    alternateName: "DungDiBinhLuan Mod Hub",
    url: "https://dungdibinhluan.com",
    description: "Trang chia sẻ mod miễn phí cho cộng đồng EA FC 26 Việt Nam",
    inLanguage: "vi-VN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://dungdibinhluan.com/mods?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: "DungDiBinhLuan",
      url: "https://dungdibinhluan.com"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DungDiBinhLuan",
    url: "https://dungdibinhluan.com",
    description: "Chuyên cung cấp mod game EA FC 26 chất lượng cao",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "Việt Nam"
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Vietnamese"
    }
  };

  const softwareApplications = [...MODS, ...FACES].map((mod) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: mod.name,
    description: mod.description || mod.longDescription,
    applicationCategory: "Game",
    operatingSystem: "Windows",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      availability: "https://schema.org/InStock"
    },
    dateModified: parseDate(mod.updatedAt).toISOString(),
    author: {
      "@type": "Person",
      name: mod.author || "DungDiBinhLuan"
    },
    publisher: {
      "@type": "Organization",
      name: "DungDiBinhLuan"
    },
    downloadUrl: mod.downloadUrl,
    screenshot: mod.thumbnail,
    softwareVersion: mod.version || "1.0",
    keywords: mod.tags?.join(", ") || "FC 26 mod, FIFA mod, game mod"
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema, null, 2),
        }}
      />
      {softwareApplications.map((app, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(app, null, 2),
          }}
        />
      ))}
    </>
  );
}
