import Image from "next/image";
import Link from "next/link";
import ShowcaseGallery from "./ShowcaseGallery";
import StickyBuyBar from "./StickyBuyBar";
import VimeoClickPlay from "./VimeoClickPlay";
import FeatureSlider from "../../components/FeatureSlider";
import { Badge } from "@/app/components/ui";
import { formatVnd } from "@/lib/catalog";
// Server component → import PRODUCTS an toàn (không vào client bundle).
// Giá/checkout/fulfillment lấy từ config chung — KHÔNG hardcode (§11).
import { PRODUCTS } from "@/lib/payment/config";

// =====================================================
// Trang chi tiết flagship MIX MODS FC 26 (§11)
// - Sản phẩm MUA 1 LẦN — không phải membership/gói thành viên.
// - Giá + đường checkout + cách nhận hàng đọc từ PRODUCTS["mix-mods"]:
//   thanh toán xác nhận → link tải gửi qua EMAIL, KHÔNG có mã kích hoạt.
// - Ngày cập nhật là dữ liệu thật của bản mod — không tự sinh theo render.
// - Chỉ claim số liệu khớp mô tả sản phẩm (≈2.000 faces — longDescription);
//   không "trọn đời"/"24/7"/"số lượng không kiểm chứng".
// =====================================================

const MIX_PRODUCT = PRODUCTS["mix-mods"];
const PRICE = formatVnd(MIX_PRODUCT.price);
const PAYMENT_HREF = MIX_PRODUCT.checkoutPath;

/** Tone Badge cố định theo tag — thay bảng hex hardcode cũ (B05). */
const TAG_TONES: Record<string, "violet" | "accent" | "credit" | "warning" | "neutral"> = {
  Faces: "violet",
  Kits: "accent",
  Gameplay: "credit",
  "Đồ họa": "warning",
  "Cơ chế game": "neutral",
};

interface MixModsDetailProps {
  mod: {
    slug: string;
    name: string;
    author: string;
    category: string;
    version: string;
    updatedAt: string;
    description: string;
    longDescription?: string;
    thumbnail: string | null;
    tags: string[];
    featured?: boolean;
    videoId?: string;
  };
}

// Các con số nổi bật — chỉ claim khớp mô tả sản phẩm (§11.2)
const HIGHLIGHTS = [
  { value: "≈2.000", label: "Faces cầu thủ mới", hint: "Facemod chọn lọc chi tiết" },
  { value: "4K", label: "Đồ họa tối ưu", hint: "Cân chỉnh theo từng máy" },
  { value: "AI", label: "Gameplay thông minh", hint: "Chân thực & mượt mà" },
  { value: "1:1", label: "Hỗ trợ cài đặt", hint: "Qua TeamViewer/UltraViewer" },
  { value: "Free", label: "Update miễn phí", hint: "Theo các bản cập nhật sau" },
] as const;

const SECTION_STYLE =
  "flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)] md:text-xs";

export default function MixModsDetail({ mod }: MixModsDetailProps) {
  const thumbnailSrc = mod.thumbnail?.trim() ? mod.thumbnail : null;

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:space-y-14 md:px-6 md:py-12">
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-[28px] border border-[var(--color-line)]">
          <div className="relative h-[440px] sm:h-[520px] md:h-[560px]">
            {thumbnailSrc ? (
              <>
                <Image
                  src={thumbnailSrc}
                  alt={mod.name}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-0)] via-[var(--color-surface-0)]/30 to-[var(--color-surface-0)]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface-0)]/80 via-transparent to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-0)]" />
            )}

            {/* Lớp ánh sáng accent chìm — token, không hex (B05) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 78% 18%, color-mix(in srgb, var(--color-accent) 34%, transparent), transparent 46%)",
              }}
            />

            {/* Badge trên cùng */}
            <div className="absolute left-5 right-5 top-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {mod.featured && <Badge tone="accent">Nổi bật</Badge>}
                <Badge tone="neutral">{mod.category}</Badge>
              </div>
              <Badge tone="neutral">
                <span className="tabular">v{mod.version}</span>
              </Badge>
            </div>

            {/* Nội dung chính dưới */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] md:mb-3 md:text-xs">
                Bản mod tổng hợp hoàn chỉnh nhất
              </p>
              <h1 className="max-w-4xl text-3xl font-black leading-[1.05] tracking-tight text-[var(--color-title)] drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)] sm:text-4xl md:text-5xl">
                {mod.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-body)] line-clamp-2 md:mt-4 md:text-base md:line-clamp-none">
                {mod.description}
              </p>

              {/* Tags */}
              {mod.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {mod.tags.map((tag) => (
                    <Badge key={tag} tone={TAG_TONES[tag] ?? "neutral"}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Meta + CTA */}
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 md:mt-7">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <Badge tone="neutral">Tác giả: {mod.author}</Badge>
                  <Badge tone="neutral">
                    <span className="tabular">Cập nhật {mod.updatedAt}</span>
                  </Badge>
                  <Badge tone="success">Thanh toán một lần</Badge>
                </div>
                <Link
                  href={PAYMENT_HREF}
                  className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[var(--color-accent)] px-6 py-3 text-sm font-black tracking-widest text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] md:px-8 md:py-4"
                >
                  Mua Mix Mods — {PRICE}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BỘ CHỈ SỐ ================= */}
        <section aria-label="Điểm nổi bật">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent-border)] md:p-5"
              >
                <p className="text-2xl font-black tracking-tight text-[var(--color-title)] md:text-[26px]">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-[var(--color-accent)] md:text-xs">
                  {item.label}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-[var(--color-muted)] md:text-[11px]">
                  {item.hint}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SHOWCASE ================= */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={SECTION_STYLE}>
                <span className="h-4 w-1 rounded-full bg-[var(--color-accent)]" />
                Showcase
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--color-title)] md:text-2xl">
                Hình ảnh thực tế trong game
              </h2>
            </div>
            <p className="hidden text-xs text-[var(--color-muted)] sm:block">
              Bấm vào ảnh để xem lớn
            </p>
          </div>
          <ShowcaseGallery slug={mod.slug} hideWhenEmpty />
        </section>
      </div>

      {/* ================= FEATURE SLIDER ================= */}
      <FeatureSlider />

      <div className="mx-auto max-w-6xl space-y-10 px-4 md:space-y-14 md:px-6">
        {/* ================= VIDEO DEMO — click-to-play ================= */}
        {mod.videoId && (
          <section className="space-y-5">
            <div>
              <p className={SECTION_STYLE}>
                <span className="h-4 w-1 rounded-full bg-[var(--color-accent)]" />
                Video demo
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--color-title)] md:text-2xl">
                Xem gameplay thực tế
              </h2>
            </div>
            <VimeoClickPlay videoId={mod.videoId} />
          </section>
        )}

        {/* ================= MÔ TẢ CHI TIẾT ================= */}
        {mod.longDescription && (
          <section className="space-y-5">
            <div>
              <p className={SECTION_STYLE}>
                <span className="h-4 w-1 rounded-full bg-[var(--color-accent)]" />
                Mô tả chi tiết
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--color-title)] md:text-2xl">
                MIX MODS gồm những gì?
              </h2>
            </div>
            <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-6 md:p-10">
              <div
                className="mx-auto max-w-3xl whitespace-pre-line text-sm leading-[1.85] text-[var(--color-body)] md:text-[15px]"
                dangerouslySetInnerHTML={{ __html: mod.longDescription }}
              />
            </div>
          </section>
        )}

        {/* ================= CTA CHÍNH (id=mix-cta — StickyBuyBar observe) ================= */}
        <section
          id="mix-cta"
          className="relative overflow-hidden rounded-[28px] border border-[var(--color-accent-border)] bg-gradient-to-br from-[var(--color-accent-subtle)] via-[var(--color-surface-0)] to-[var(--color-violet-subtle)] p-7 md:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[var(--color-accent)]/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--color-violet)]/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-2 text-center lg:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] md:text-xs">
                Mua 1 lần — không phải gói thành viên
              </p>
              <p className="tabular text-3xl font-black text-[var(--color-title)] md:text-4xl">
                {PRICE}
              </p>
              {/* Cách nhận hàng — đúng fulfillment config: link qua email,
                  KHÔNG có mã kích hoạt (§11) */}
              <p className="text-sm font-bold text-[var(--color-accent-strong)]">
                {MIX_PRODUCT.fulfillment.receiveText}
              </p>
              <ol className="mx-auto max-w-md list-decimal space-y-0.5 pl-5 text-left text-xs text-[var(--color-muted)] lg:mx-0">
                {MIX_PRODUCT.fulfillment.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:w-72 lg:flex-col">
              <Link
                href={PAYMENT_HREF}
                className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[var(--color-accent)] px-8 py-4 text-sm font-black tracking-widest text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
              >
                Mua Mix Mods
              </Link>
              <a
                href="#mods-related"
                className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-8 py-3.5 text-sm font-bold text-[var(--color-title)] transition-colors hover:border-[var(--color-accent-border)]"
              >
                Xem mods liên quan ↓
              </a>
            </div>
          </div>
        </section>

        <p className="text-center text-xs italic text-[var(--color-muted)]">
          Lưu ý: bản mod chỉ dành cho người đã có game. Chưa có game?{" "}
          <Link
            href="/games/fc26/select"
            className="font-semibold text-[var(--color-accent)] hover:underline"
          >
            Xem FC 26
          </Link>
        </p>
      </div>

      <StickyBuyBar price={PRICE} href={PAYMENT_HREF} />
    </>
  );
}
