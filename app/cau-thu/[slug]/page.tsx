import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogPlayerBySlug } from "@/lib/server/players";
import {
  baseValueKindLabel,
  formatEurFull,
  genderLabel,
  preferredFootLabel,
} from "@/lib/players/format";
import { STAT_GROUPS } from "@/lib/players/normalize";
import type { PlayerDetailDto } from "@/lib/players/types";
import { Breadcrumb, ButtonLink, Container } from "@/app/components/ui";
import { PlayerAvatar } from "../components/PlayerAvatar";
import styles from "../players.module.css";

// =====================================================
// /cau-thu/[slug] — chi tiết cầu thủ (blueprint §9.3)
// Không hiển thị ID/hash/release/timestamp kỹ thuật (§9.4).
// =====================================================

const SITE_URL = "https://dungdibinhluan.com";

/** 6 chỉ số "face" — outfield PAC/SHO/PAS/DRI/DEF/PHY; thủ môn có
    bộ mã + nhãn riêng, KHÔNG gắn nhãn PAC/SHO máy móc (§9.3). */
const OUTFIELD_FACE_STATS = [
  { key: "pac", code: "PAC", label: "Tốc độ" },
  { key: "sho", code: "SHO", label: "Dứt điểm" },
  { key: "pas", code: "PAS", label: "Chuyền bóng" },
  { key: "dri", code: "DRI", label: "Rê bóng" },
  { key: "def", code: "DEF", label: "Phòng ngự" },
  { key: "phy", code: "PHY", label: "Thể chất" },
] as const;

const GK_FACE_STATS = [
  { key: "gkDiving", code: "DIV", label: "Đổ người" },
  { key: "gkHandling", code: "HAN", label: "Bắt bóng" },
  { key: "gkKicking", code: "KIC", label: "Phát bóng" },
  { key: "gkPositioning", code: "POS", label: "Chọn vị trí" },
  { key: "gkReflexes", code: "REF", label: "Phản xạ" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: player, error } = await getCatalogPlayerBySlug(slug);

  // notFound() trong generateMetadata (chạy TRƯỚC khi body stream) để
  // response thật sự là 404 — gọi trong body thì header 200 đã flush,
  // trang "không tìm thấy" thành soft-404 sai SEO (§9.4, §10).
  // Chỉ khi KHÔNG có error: lỗi DB để page throw ra error boundary,
  // không biến thành 404 giả.
  if (!player && !error) notFound();
  if (!player) return { title: "Không tải được dữ liệu" };

  const club = player.team_name ? ` — ${player.team_name}` : "";
  const bits = [
    `Tổng quát ${player.overall_rating}`,
    player.potential != null ? `Tiềm năng ${player.potential}` : null,
    player.team_name,
    player.game_label,
  ].filter(Boolean);

  return {
    title: `${player.display_name}${club}`,
    description: `${player.display_name}${club}: ${bits.join(" · ")}. Xem giá tham khảo, lương trong game và chỉ số chi tiết.`,
    alternates: { canonical: `${SITE_URL}/cau-thu/${slug}` },
    openGraph: {
      title: `${player.display_name}${club} | DungDiBinhLuan`,
      description: `${bits.join(" · ")}.`,
      url: `${SITE_URL}/cau-thu/${slug}`,
    },
  };
}

// ---------- View helpers ----------

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] py-2.5 last:border-0">
      <dt className="shrink-0 text-meta text-[var(--color-muted)]">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-[var(--color-title)]">
        {value}
      </dd>
    </div>
  );
}

/** Kỹ thuật / Chân yếu — sao 1–5, có nhãn đọc được cho screen reader. */
function StarRating({ value }: { value: number | null }) {
  if (value == null || value < 1) return <>{"Chưa có"}</>;
  const n = Math.min(5, Math.max(0, value));
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="tracking-wide text-[var(--color-warn)]">
        {"★".repeat(n)}
        {"☆".repeat(5 - n)}
      </span>
      <span className="sr-only">{n} trên 5 sao</span>
    </span>
  );
}

function StatBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-sm text-[var(--color-body)] sm:w-44">
        {label}
      </span>
      {value != null ? (
        <>
          <span
            aria-hidden="true"
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]"
          >
            <span
              className="block h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right tabular text-sm font-semibold text-[var(--color-title)]">
            {value}
          </span>
        </>
      ) : (
        <span className="text-sm text-[var(--color-muted)]">Chưa có</span>
      )}
    </div>
  );
}

function formatValuationDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("vi-VN", { timeZone: "UTC" });
}

// ---------- Page ----------

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: player, error } = await getCatalogPlayerBySlug(slug);

  if (error) {
    // Lỗi dữ liệu ≠ 404 giả — ném ra error boundary (§9.4 / §12)
    throw new Error("Không tải được dữ liệu cầu thủ");
  }
  if (!player) notFound();

  const p: PlayerDetailDto = player;
  // Thủ môn: position_short === "GK", hoặc khi thiếu vị trí mà stats
  // chỉ có nhóm bắt bóng (không có face stat outfield) → vẫn nhận GK.
  const isGk =
    p.position_short === "GK" ||
    (p.position_short == null &&
      p.stats.gkDiving != null &&
      p.stats.pac == null);
  const faceStats = isGk ? GK_FACE_STATS : OUTFIELD_FACE_STATS;

  const metaLine = [p.team_name, p.nationality_name, p.position_short]
    .filter(Boolean)
    .join(" · ");

  const kindLabel = baseValueKindLabel(p.base_value_kind);
  const valuationDate = formatValuationDate(p.valuation_date);
  const gender = genderLabel(p.gender);

  // Accordion chỉ hiện nhóm có ít nhất 1 chỉ số thực — thủ môn tự
  // động rơi vào nhóm "Thủ môn", outfield có các nhóm còn lại.
  const visibleGroups = STAT_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => p.stats[i.key] != null),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <Container className="py-6 md:py-10">
        <div className="max-w-3xl">
          <Breadcrumb
            items={[
              { label: "Cầu thủ", href: "/cau-thu" },
              { label: p.display_name },
            ]}
          />

          {/* Header: ảnh nhỏ + tên + CLB · Quốc tịch · Vị trí */}
          <header className="mt-6 flex items-center gap-4">
            <PlayerAvatar
              name={p.display_name}
              url={p.avatar_url}
              className="h-16 w-16 text-lg"
            />
            <div className="min-w-0">
              <h1 className="text-h1 text-[var(--color-title)]">
                {p.display_name}
              </h1>
              {metaLine && (
                <p className="mt-1.5 text-[15px] text-[var(--color-muted)]">
                  {metaLine}
                </p>
              )}
            </div>
          </header>

          {/* Hai thẻ chỉ số tổng */}
          <div className="mt-6 grid max-w-sm grid-cols-2 gap-3">
            <div className="surface-card rounded-2xl px-4 py-3.5 text-center">
              <p className="text-meta text-[var(--color-muted)]">Tổng quát</p>
              <p className="mt-1 text-h2 tabular text-[var(--color-title)]">
                {p.overall_rating}
              </p>
            </div>
            <div className="surface-card rounded-2xl px-4 py-3.5 text-center">
              <p className="text-meta text-[var(--color-muted)]">Tiềm năng</p>
              <p className="mt-1 text-h2 tabular text-[var(--color-title)]">
                {p.potential ?? "Chưa có"}
              </p>
            </div>
          </div>

          {/* Giá tham khảo + lương */}
          <section
            aria-label="Giá và lương"
            className="mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-meta font-medium text-[var(--color-muted)]">
                  Giá tham khảo
                </p>
                <p className="mt-1 text-price text-[var(--color-title)]">
                  {formatEurFull(p.reference_value_eur)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-meta font-medium text-[var(--color-muted)]">
                  Lương trong game / tuần
                </p>
                <p className="mt-1 text-h2 tabular text-[var(--color-title)]">
                  {p.weekly_wage_eur != null
                    ? formatEurFull(p.weekly_wage_eur)
                    : "Chưa có"}
                </p>
              </div>
            </div>

            {(kindLabel ||
              (p.is_adjusted && p.reference_value_eur != null) ||
              p.valuation_source_name ||
              valuationDate) && (
              <div className="mt-4 space-y-1.5 border-t border-[var(--color-line)] pt-4 text-meta text-[var(--color-muted)]">
                {kindLabel && <p>Cơ sở: {kindLabel}</p>}
                {p.is_adjusted && p.reference_value_eur != null && (
                  <p>Đã cộng 10% vào giá cơ sở.</p>
                )}
                {(p.valuation_source_name || valuationDate) && (
                  <p>
                    Nguồn:{" "}
                    {p.valuation_source_name &&
                      (p.valuation_source_url ? (
                        <a
                          href={p.valuation_source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--color-accent-strong)] underline underline-offset-2 hover:text-[var(--color-accent)]"
                        >
                          {p.valuation_source_name}
                        </a>
                      ) : (
                        p.valuation_source_name
                      ))}
                    {p.valuation_source_name && valuationDate && " · "}
                    {valuationDate}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Thông tin cơ bản */}
          <section
            aria-labelledby="basic-info"
            className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6"
          >
            <h2 id="basic-info" className="text-h3 text-[var(--color-title)]">
              Thông tin cơ bản
            </h2>
            <dl className="mt-3">
              <MetaRow label="Tuổi" value={p.age ?? "Chưa có"} />
              <MetaRow
                label="Chiều cao"
                value={p.height_cm != null ? `${p.height_cm} cm` : "Chưa có"}
              />
              <MetaRow
                label="Cân nặng"
                value={p.weight_kg != null ? `${p.weight_kg} kg` : "Chưa có"}
              />
              <MetaRow
                label="Chân thuận"
                value={preferredFootLabel(p.preferred_foot) ?? "Chưa có"}
              />
              <MetaRow
                label="Kỹ thuật"
                value={<StarRating value={p.skill_moves} />}
              />
              <MetaRow
                label="Chân yếu"
                value={<StarRating value={p.weak_foot} />}
              />
              {p.league_name && (
                <MetaRow label="Giải đấu" value={p.league_name} />
              )}
              {gender && <MetaRow label="Giới tính" value={gender} />}
              {p.alt_positions.length > 0 && (
                <MetaRow
                  label="Vị trí phụ"
                  value={p.alt_positions.join(", ")}
                />
              )}
              <MetaRow label="Bản game" value={p.game_label} />
            </dl>
          </section>

          {/* Chỉ số: 6 face stats + accordion nhóm chi tiết */}
          <section aria-labelledby="stats" className="mt-6">
            <h2 id="stats" className="text-h3 text-[var(--color-title)]">
              Chỉ số
            </h2>

            <div
              className={`mt-4 grid grid-cols-3 gap-2 ${
                isGk ? "sm:grid-cols-5" : "sm:grid-cols-6"
              }`}
            >
              {faceStats.map((s) => {
                const value = p.stats[s.key];
                return (
                  <div
                    key={s.key}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)] px-2 py-2.5 text-center"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      {s.code}
                    </p>
                    {value != null ? (
                      <p className="mt-0.5 text-xl font-extrabold tabular text-[var(--color-title)]">
                        {value}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm font-medium text-[var(--color-muted)]">
                        Chưa có
                      </p>
                    )}
                    <p className="text-[11px] leading-tight text-[var(--color-muted)]">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {visibleGroups.length > 0 && (
              <div className="mt-4 space-y-2">
                {visibleGroups.map((g, gi) => (
                  <details
                    key={g.title}
                    className={styles.statDetails}
                    open={gi === 0}
                  >
                    <summary>
                      {g.title}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`${styles.chev} h-4 w-4`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    <div className={styles.statBody}>
                      {g.items.map((item) => (
                        <StatBar
                          key={item.key}
                          label={item.label}
                          value={p.stats[item.key] ?? null}
                        />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          <div className="mt-8">
            <ButtonLink href="/cau-thu" variant="secondary" size="sm">
              <span aria-hidden="true">← </span>Quay lại danh sách
            </ButtonLink>
          </div>
        </div>
      </Container>
    </main>
  );
}
