import type { Metadata } from "next";
import { Container } from "@/app/components/ui";
import {
  listCatalogPlayers,
  getCatalogFilterOptions,
} from "@/lib/server/players";
import {
  CATALOG_PARAM_KEYS,
  parseCatalogParams,
} from "@/lib/players/params";
import { CatalogToolbar } from "../components/CatalogToolbar";
import { PlayersTable } from "../components/PlayersTable";
import { PlayerListMobile } from "../components/PlayerListMobile";
import { Pagination } from "../components/Pagination";
import { CatalogEmpty, CatalogError } from "../components/CatalogStates";

// =====================================================
// /cau-thu — danh bạ cầu thủ (blueprint §8, §9.1–9.2)
// URL chứa filter/search → noindex (chống nhân bản vô hạn);
// trang sạch canonical /cau-thu.
// =====================================================

type PageSearchParams = Record<string, string | string[] | undefined>;

const CANONICAL = "https://dungdibinhluan.com/cau-thu";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const hasCatalogQuery = Object.values(CATALOG_PARAM_KEYS).some(
    (key) => sp[key] != null
  );
  return {
    title: "Cầu thủ — tra cứu database",
    description:
      "Tra cứu database cầu thủ: tìm theo tên, lọc theo vị trí, CLB, quốc tịch, chỉ số và ngân sách. Giá tham khảo và lương trong game.",
    alternates: { canonical: CANONICAL },
    // URL có filter/search/sort/trang → không index (canonical vẫn trỏ
    // trang sạch); follow để crawler tới được trang chi tiết cầu thủ.
    robots: hasCatalogQuery
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

/** searchParams (có thể array) → query string để Pagination giữ query. */
function toQueryString(sp: PageSearchParams): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) usp.append(key, v);
    } else {
      usp.set(key, value);
    }
  }
  return usp.toString();
}

export default async function PlayersCatalogPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const sp = await searchParams;
  const params = parseCatalogParams(sp);

  // List + filter options trong cùng lượt đọc (ghim release phía server §8)
  const [result, filterOptions] = await Promise.all([
    listCatalogPlayers(params),
    getCatalogFilterOptions(),
  ]);

  const queryString = toQueryString(sp);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <Container className="py-10 md:py-14">
        <header className="max-w-2xl">
          <h1 className="text-h1 text-[var(--color-title)]">Cầu thủ</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Tìm cầu thủ theo vị trí, chỉ số và ngân sách.
          </p>
        </header>

        <CatalogToolbar filterOptions={filterOptions} />

        <div className="mt-6">
          {result.error ? (
            <CatalogError />
          ) : result.data.length === 0 ? (
            <CatalogEmpty />
          ) : (
            <>
              <p className="mb-3 text-meta text-[var(--color-muted)]">
                {result.count.toLocaleString("vi-VN")} cầu thủ
              </p>
              <PlayersTable players={result.data} />
              <PlayerListMobile players={result.data} />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                queryString={queryString}
              />
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
