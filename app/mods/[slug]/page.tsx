import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getModCreditConfigBySlug } from "@/lib/server/credit";
import { DEFAULT_MOD_CREDIT_COST } from "@/lib/credit-core";
import { MODS, type Mod } from "../../data/mods";
import { FACES } from "../../data/faces";
import ModUnlockWall from "../components/ModUnlockWall";
import MixModsDetail from "../components/MixModsDetail";
import ShowcaseGallery from "../components/ShowcaseGallery";
import ModCard, { OfferBadge } from "../components/ModCard";
import { extractTopicTerms, overlapScore } from "@/lib/related-content";
import {
  buildCatalog,
  formatUpdatedAt,
  resolveMediaSrc,
  type DbModRecord,
  type ModSummary,
  type StaticModInput,
} from "@/lib/catalog";
import {
  Badge,
  Breadcrumb,
  ButtonLink,
  Container,
  InlineNotice,
} from "@/app/components/ui";
// SUPPORT_URL chỉ dùng trong SERVER component — client components
// không import lib/payment/* (kéo directDownloadUrl vào bundle — §20.4).
import { SUPPORT_URL } from "@/lib/payment/order-status";

const ALL_STATIC_MODS: Mod[] = [...(FACES as Mod[]), ...MODS];
const SITE_URL = "https://dungdibinhluan.com";

// ISR 300s — đồng bộ chính sách /mods: credit config + metadata DB
// tươi lại đủ nhanh, vẫn cache được.
export const revalidate = 300;

// =====================================================
// Data — B02: DB ưu tiên thống nhất với catalog
// (static chỉ làm fallback từng field / khi DB không có slug)
// =====================================================

// Database mod interface
interface DbMod {
  id: string;
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  updated_at: string;
  description: string | null;
  long_description: string | null;
  thumbnail: string | null;
  download_url: string | null;
  tags: string[];
  thumbnail_orientation: string;
  featured: boolean;
  video_id: string | null;
  created_at: string;
}

/**
 * Merge chi tiết: DB record hợp lệ thắng, từng field trống/thiếu
 * rơi về static cùng slug — cùng semantics với lib/catalog adapter.
 */
function mergeDbModDetail(dbMod: DbMod, staticMod?: Mod): Mod {
  return {
    slug: dbMod.slug,
    name: dbMod.name?.trim() || staticMod?.name || "",
    author: dbMod.author?.trim() || staticMod?.author || "DungDiBinhLuan",
    category: dbMod.category?.trim() || staticMod?.category || "Mod",
    version: dbMod.version?.trim() || staticMod?.version || "",
    // Ngày cập nhật THẬT, chuẩn hóa dd/mm/yyyy (§10.1) — không tự
    // sinh ngày hôm nay (§4.3).
    updatedAt:
      formatUpdatedAt(dbMod.updated_at) ??
      formatUpdatedAt(staticMod?.updatedAt) ??
      "",
    description: dbMod.description?.trim() || staticMod?.description || "",
    longDescription:
      dbMod.long_description || staticMod?.longDescription || "",
    thumbnail:
      resolveMediaSrc(dbMod.thumbnail) ??
      resolveMediaSrc(staticMod?.thumbnail) ??
      "",
    downloadUrl: dbMod.download_url?.trim() || staticMod?.downloadUrl || "",
    tags:
      dbMod.tags && dbMod.tags.length > 0 ? dbMod.tags : (staticMod?.tags ?? []),
    thumbnailOrientation:
      (dbMod.thumbnail_orientation as "portrait" | "landscape") ||
      staticMod?.thumbnailOrientation,
    featured: Boolean(dbMod.featured) || staticMod?.featured === true,
    videoId: dbMod.video_id || staticMod?.videoId,
  } as Mod;
}

async function fetchDbMod(slug: string): Promise<DbMod | null> {
  const { data, error } = await supabaseAdmin
    .from("mods")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as DbMod;
}

let _dbModsCache: { data: DbMod[]; ts: number } | null = null;
const DB_MODS_CACHE_TTL = 60000;

async function fetchDbMods(): Promise<DbMod[]> {
  if (_dbModsCache && Date.now() - _dbModsCache.ts < DB_MODS_CACHE_TTL) {
    return _dbModsCache.data;
  }
  // created_at desc — adapter giữ bản đầu khi trùng slug (bản mới nhất)
  const { data, error } = await supabaseAdmin
    .from("mods")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  _dbModsCache = { data: data as DbMod[], ts: Date.now() };
  return _dbModsCache.data;
}

/** B02: DB ưu tiên — giống catalog; static chỉ fallback. */
async function getMod(slug: string): Promise<Mod | null> {
  const staticMod = ALL_STATIC_MODS.find((m) => m.slug === slug);
  const dbMod = await fetchDbMod(slug);
  if (dbMod) return mergeDbModDetail(dbMod, staticMod);
  if (!staticMod) return null;
  return {
    ...staticMod,
    // Chuẩn hóa ngày + thumbnail qua cùng pipeline với DB path
    updatedAt: formatUpdatedAt(staticMod.updatedAt) ?? staticMod.updatedAt,
    thumbnail: resolveMediaSrc(staticMod.thumbnail) ?? staticMod.thumbnail,
  };
}

// ---------- Related mods — qua catalog (T03: cùng metadata với card) ----------

function getRelatedScore(current: ModSummary, candidate: ModSummary) {
  const sharedTags = overlapScore(current.tags, candidate.tags);
  const sameCategory = current.category === candidate.category ? 1 : 0;
  const currentTerms = extractTopicTerms(
    `${current.name} ${current.description}`,
  );
  const candidateTerms = extractTopicTerms(
    `${candidate.name} ${candidate.description}`,
  );
  const sharedTerms = overlapScore(currentTerms, candidateTerms);
  return sharedTags * 24 + sameCategory * 12 + sharedTerms * 3;
}

async function getRelatedMods(currentMod: Mod): Promise<ModSummary[]> {
  const dbMods = (await fetchDbMods()) as DbModRecord[];
  const catalog = buildCatalog(
    ALL_STATIC_MODS as StaticModInput[],
    dbMods,
  );

  const current =
    catalog.find((m) => m.slug === currentMod.slug) ??
    buildCatalog([currentMod as StaticModInput], [])[0];
  if (!current) return [];

  return catalog
    .filter((m) => m.slug !== current.slug)
    .map((m) => ({ m, score: getRelatedScore(current, m) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.m.updatedAtTs - a.m.updatedAtTs)
    .slice(0, 8)
    .map((x) => x.m);
}

// ---------- SEO ----------

function getAbsoluteImageUrl(image?: string | null) {
  if (!image) return `${SITE_URL}/og-image.jpg`;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

/**
 * JSON-LD — §10.3/§20.4: mod khóa credit KHÔNG đặt downloadUrl vào
 * structured data (đó là nội dung protected).
 */
function getSoftwareApplicationSchema(mod: Mod, locked: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: mod.name,
    description: mod.description || undefined,
    applicationCategory: "GameApplication",
    operatingSystem: "Windows",
    author: {
      "@type": "Person",
      name: mod.author || "DungDiBinhLuan",
    },
    publisher: {
      "@type": "Organization",
      name: "DungDiBinhLuan",
      url: SITE_URL,
    },
    softwareVersion: mod.version || undefined,
    screenshot: getAbsoluteImageUrl(mod.thumbnail),
    ...(locked ? {} : { downloadUrl: mod.downloadUrl || undefined }),
    keywords: mod.tags?.join(", ") || "FC 26 mod, FIFA mod, game mod",
    url: `${SITE_URL}/mods/${mod.slug}`,
  };
}

export async function generateStaticParams() {
  // Only generate static params for static mods
  // Database mods will be dynamically rendered
  return ALL_STATIC_MODS.map((mod) => ({ slug: mod.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = await getMod(slug);

  if (!mod) return { title: "Mod không tồn tại" };
  const canonical = `${SITE_URL}/mods/${mod.slug}`;
  const imageUrl = getAbsoluteImageUrl(mod.thumbnail);
  const description = mod.description || "Chi tiết mod FC 26";

  return {
    title: mod.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${mod.name} | DungDiBinhLuan`,
      description,
      url: canonical,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${mod.name} | DungDiBinhLuan`,
      description,
      images: [imageUrl],
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

/**
 * Phiên bản mod vs phiên bản game (§10.1):
 * field `version` chứa cả "TU x.y.z" (Title Update = bản cập nhật GAME)
 * lẫn "v1.0" (bản mod). TU → nhãn "Tương thích", còn lại → "Phiên bản mod".
 */
function VersionMetaRow({ version }: { version: string }) {
  if (!version.trim()) return null;
  const isTu = /^TU[\s.]/i.test(version.trim());
  return (
    <MetaRow
      label={isTu ? "Tương thích" : "Phiên bản mod"}
      value={
        isTu
          ? `FC 26 — ${version.trim()} (bản cập nhật game)`
          : version.trim()
      }
    />
  );
}

// =====================================================
// Page
// =====================================================

export default async function ModDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = await getMod(slug);

  if (!mod) return notFound();

  const isMixMods = mod.slug === "mix-mods-fc26";
  const thumbnailSrc = mod.thumbnail?.trim() ? mod.thumbnail : null;
  const isPortrait = mod.thumbnailOrientation !== "landscape";
  const hasDownload = Boolean(mod.downloadUrl?.trim());
  const relatedMods = await getRelatedMods(mod);
  const creditConfig = await getModCreditConfigBySlug(slug);
  const isLocked = creditConfig.enabled;

  const breadcrumbItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Kho mod", href: "/mods" },
    { label: mod.name },
  ];

  // ---------- Mod yêu cầu credit → paywall có preview (§10.2/§10.3) ----------
  if (isLocked) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-0)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSoftwareApplicationSchema(mod, true)),
          }}
        />
        <Container className="py-6 md:py-10">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-6">
            <ModUnlockWall
              slug={slug}
              name={mod.name}
              author={mod.author}
              category={mod.category}
              version={mod.version}
              updatedAt={mod.updatedAt}
              tags={mod.tags ?? []}
              thumbnail={thumbnailSrc}
              description={mod.description || ""}
              creditCost={creditConfig.creditCost ?? DEFAULT_MOD_CREDIT_COST}
            />
          </div>
        </Container>
        <RelatedModsSection relatedMods={relatedMods} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getSoftwareApplicationSchema(mod, false)),
        }}
      />
      <Container className="py-6 md:py-10">
        <Breadcrumb items={breadcrumbItems} />

        {isMixMods ? (
          <div className="mt-6">
            <MixModsDetail
              mod={{
                slug: mod.slug,
                name: mod.name,
                author: mod.author,
                category: mod.category,
                version: mod.version,
                // Ngày cập nhật THẬT của bản mod — không tự sinh theo render (§11.2)
                updatedAt: mod.updatedAt,
                description: mod.description || "",
                longDescription: mod.longDescription || "",
                thumbnail: thumbnailSrc,
                tags: mod.tags ?? [],
                featured: mod.featured,
                videoId: mod.videoId,
              }}
            />
          </div>
        ) : (
          <>
            {/* ===== Hero 2 cột: gallery ~60% / summary+action ~40% (§10.1)
                Mobile: tên/metadata → ảnh → giá/quyền/CTA → nội dung ===== */}
            <div className="mt-6 grid gap-8 lg:grid-cols-5">
              {/* Gallery — cover + showcase public */}
              <div className="order-2 space-y-6 lg:order-none lg:col-span-3">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
                  {thumbnailSrc ? (
                    <Image
                      src={thumbnailSrc}
                      alt={mod.name}
                      fill
                      className={
                        isPortrait
                          ? "object-contain object-center p-4"
                          : "object-cover object-center"
                      }
                      sizes="(max-width: 1024px) 100vw, 720px"
                      priority
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="text-3xl font-black text-[var(--color-line-strong)]">
                        {mod.name.charAt(0).toUpperCase() || "M"}
                      </span>
                    </div>
                  )}
                </div>
                <ShowcaseGallery
                  slug={mod.slug}
                  hideWhenEmpty
                  heading="Hình ảnh trong game"
                />
              </div>

              {/* Summary + action — contents trên mobile để order hoạt động */}
              <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-6">
                <div className="order-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{mod.category}</Badge>
                    {mod.featured && <Badge tone="accent">Nổi bật</Badge>}
                    <OfferBadge
                      offer={
                        hasDownload
                          ? { kind: "free" }
                          : { kind: "contact", label: "Liên hệ" }
                      }
                    />
                  </div>
                  <h1 className="mt-3 text-h1 text-[var(--color-title)]">
                    {mod.name}
                  </h1>
                  {mod.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {mod.tags.map((tag) => (
                        <Badge key={tag} tone="neutral">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <dl className="mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] px-5">
                    <MetaRow label="Tác giả" value={mod.author} />
                    <VersionMetaRow version={mod.version} />
                    <MetaRow label="Game" value="EA FC 26" />
                    <MetaRow label="Cập nhật" value={mod.updatedAt || "—"} />
                    <MetaRow
                      label="Loại quyền"
                      value={hasDownload ? "Miễn phí" : "Liên hệ"}
                    />
                  </dl>
                </div>

                {/* Action — giá/quyền/CTA (mobile order-3: sau ảnh) */}
                <div className="order-3">
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6">
                    {hasDownload ? (
                      <>
                        <p className="text-meta text-[var(--color-muted)]">
                          Sẵn sàng cài đặt
                        </p>
                        <p className="mt-1 text-h3 text-[var(--color-title)]">
                          Tải xuống miễn phí
                        </p>
                        <ButtonLink
                          href={mod.downloadUrl}
                          external
                          size="lg"
                          fullWidth
                          className="mt-4"
                        >
                          Tải mod
                        </ButtonLink>
                      </>
                    ) : (
                      <>
                        <InlineNotice
                          tone="warning"
                          title="Chưa có link tải"
                        >
                          Link tải cho phiên bản này chưa được cập nhật — liên
                          hệ hỗ trợ để được cấp.
                        </InlineNotice>
                        <ButtonLink
                          href={SUPPORT_URL}
                          external
                          variant="secondary"
                          size="lg"
                          fullWidth
                          className="mt-4"
                        >
                          Liên hệ hỗ trợ
                        </ButtonLink>
                      </>
                    )}
                    <p className="mt-4 text-meta text-[var(--color-muted)]">
                      Bản mod chỉ dành cho người đã có game. Chưa có game?{" "}
                      <ButtonLink
                        href="/games/fc26/select"
                        variant="ghost"
                        size="sm"
                        className="!h-auto px-1 align-baseline text-[var(--color-accent-strong)]"
                      >
                        Xem FC 26
                      </ButtonLink>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Nội dung ===== */}
            {mod.description || mod.longDescription ? (
              <section
                aria-label="Mô tả chi tiết"
                className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-8"
              >
                <h2 className="text-h2 text-[var(--color-title)]">Mô tả</h2>
                {mod.description ? (
                  <p className="mt-3 text-[15px] font-medium leading-relaxed text-[var(--color-title)]">
                    {mod.description}
                  </p>
                ) : null}
                {mod.longDescription ? (
                  <div
                    className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-body)]"
                    dangerouslySetInnerHTML={{ __html: mod.longDescription }}
                  />
                ) : null}
              </section>
            ) : null}

            {/* ===== Hướng dẫn ===== */}
            <section
              aria-label="Hướng dẫn cài đặt"
              className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6"
            >
              <h2 className="text-h3 text-[var(--color-title)]">
                Cài đặt mod như thế nào?
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-body)]">
                Tải file, giải nén và làm theo hướng dẫn cài mod cho FC 26.
                Gặp lỗi trong quá trình cài có thể nhắn kênh hỗ trợ.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href="/huong-dan" variant="secondary" size="sm">
                  Xem hướng dẫn cài mod
                </ButtonLink>
                <ButtonLink href={SUPPORT_URL} external variant="ghost" size="sm">
                  Liên hệ hỗ trợ
                </ButtonLink>
              </div>
            </section>
          </>
        )}
      </Container>

      <RelatedModsSection relatedMods={relatedMods} />
    </main>
  );
}

// ---------- Related ----------

function RelatedModsSection({ relatedMods }: { relatedMods: ModSummary[] }) {
  if (relatedMods.length === 0) return null;
  return (
    <section id="mods-related" aria-label="Mod liên quan" className="pb-14">
      <Container>
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-h2 text-[var(--color-title)]">Mods liên quan</h2>
            <ButtonLink href="/mods" variant="ghost" size="sm">
              Xem tất cả
            </ButtonLink>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedMods.map((relatedMod) => (
              <li key={relatedMod.slug} className="min-w-0">
                <ModCard mod={relatedMod} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
