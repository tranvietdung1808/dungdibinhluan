"use client";

// =====================================================
// Mod Library — grid responsive các mod đã unlock
// Violet = accent phụ (profile/mod)
// =====================================================

import type { UnlockedMod } from "../types";
import { Badge, Card, Icon } from "./ui";
import { EmptyState, formatDate } from "./states";

export function ModLibrarySection({ items }: { items: UnlockedMod[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="unlock"
        title="Chưa mở mod nào"
        description="Các mod bạn mở bằng membership/credit sẽ hiển thị ở đây dưới dạng thư viện cá nhân."
        ctaLabel="Khám phá mods"
        ctaHref="/mods"
        footnote="Hồ sơ mod được lưu tối đa 60 ngày gần nhất để giữ thư viện gọn gàng."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          <span className="font-bold text-title">{items.length}</span> mod trong thư viện
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {items.map((item) => <ModCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function ModCard({ item }: { item: UnlockedMod }) {
  const mod = item.mod;
  const href = mod ? `/mods/${mod.slug}` : "/mods";
  return (
    <a href={href} className="group block">
      <Card className="overflow-hidden hover:surface-raised transition-colors duration-150 h-full">
        <div className="aspect-video bg-surface-0 overflow-hidden relative">
          {mod?.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mod.thumbnail}
              alt={mod.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet/70">
              <Icon name="unlock" className="w-9 h-9" />
            </div>
          )}
          <span className="absolute top-2.5 right-2.5">
            <Badge tone="violet">
              <Icon name="unlock" className="w-3 h-3" />
              Đã mở
            </Badge>
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-title text-sm leading-snug truncate group-hover:text-violet transition-colors">
            {mod?.name ?? "Mod không còn tồn tại"}
          </h3>
          <p className="text-[11px] text-muted mt-1 truncate">
            {mod?.category ?? "Không rõ danh mục"}
            {mod?.tags?.length ? ` · ${mod.tags.slice(0, 2).join(", ")}` : ""}
          </p>
          <p className="text-[11px] text-muted/70 mt-2 flex items-center gap-1">
            <Icon name="clock" className="w-3 h-3" />
            Mở vào {formatDate(item.unlocked_at)}
          </p>
        </div>
      </Card>
    </a>
  );
}