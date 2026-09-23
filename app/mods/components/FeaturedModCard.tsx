"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/app/components/ui/Badge";
import type { ModSummary } from "@/lib/catalog";
import { OfferBadge } from "./ModCard";

interface FeaturedModCardProps {
  mod: ModSummary;
  /** User đã mở khóa mod credit này */
  owned?: boolean;
}

export default function FeaturedModCard({ mod, owned = false }: FeaturedModCardProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(mod.thumbnail) && !imageError;

  return (
    <Link href={`/mods/${mod.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-3xl border border-[var(--color-accent-border)] bg-[var(--color-surface-1)] shadow-[var(--shadow-ambient)] transition-transform duration-300 group-hover:-translate-y-1">
        {/* Đường accent trên cùng card */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-70"
        />

        <div className="relative h-56 md:h-72 bg-[var(--color-surface-2)]">
          {showImage ? (
            <Image
              src={mod.thumbnail as string}
              alt={mod.name}
              fill
              className="object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1180px) 100vw, 1180px"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-0)]"
            />
          )}

          {/* Scrim giữ chữ đọc được trên ảnh */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
          />

          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            <Badge tone="accent">Nổi bật</Badge>
            <Badge tone="neutral">{mod.category}</Badge>
          </div>
          <div className="absolute right-4 top-4 z-10">
            <OfferBadge offer={mod.offer} owned={owned} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <h2 className="line-clamp-2 text-xl font-bold leading-tight text-white transition-colors group-hover:text-[var(--color-accent-strong)] md:text-2xl">
            {mod.name}
          </h2>
          {mod.description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-[var(--color-body)]">
              {mod.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-[var(--color-muted)]">
            <span className="truncate" title={mod.author}>
              {mod.author}
            </span>
            {mod.version && <span className="tabular">{mod.version}</span>}
            {mod.updatedAt && (
              <span className="tabular">Cập nhật {mod.updatedAt}</span>
            )}
            <span className="ml-auto shrink-0 font-semibold text-[var(--color-accent-strong)] transition-colors group-hover:text-[var(--color-accent)]">
              Xem chi tiết →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
