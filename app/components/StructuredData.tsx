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
