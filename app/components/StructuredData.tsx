export default function StructuredData() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DungDiBinhLuan",
    alternateName: "DungDiBinhLuan Mod Hub",
    url: "https://dungdibinhluan.com",
    description:
      "EA FC 27, kho mod FC 26 và hướng dẫn Career Mode cho cộng đồng Việt Nam",
    inLanguage: "vi-VN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://dungdibinhluan.com/mods?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "DungDiBinhLuan",
      url: "https://dungdibinhluan.com",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DungDiBinhLuan",
    url: "https://dungdibinhluan.com",
    description: "Cung cấp EA FC 27, mod game bóng đá và hướng dẫn Career Mode",
    foundingDate: "2024",
    areaServed: {
      "@type": "Country",
      name: "Việt Nam",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Vietnamese",
    },
  };

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
    </>
  );
}
