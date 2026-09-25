"use client";

import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, Spinner } from "@/app/components/ui";

// =====================================================
// CatalogStates — trạng thái danh sách theo §9.4
// Loading inline / Empty (kèm nút xóa lọc) / Error (kèm nút tải lại)
// =====================================================

/** "Đang tìm cầu thủ…" — inline khi router đang cập nhật URL. */
export function CatalogPending() {
  return (
    <p
      role="status"
      className="flex items-center gap-2 text-sm text-[var(--color-muted)]"
    >
      <Spinner size={16} label="Đang tải" />
      Đang tìm cầu thủ…
    </p>
  );
}

export function CatalogEmpty() {
  return (
    <EmptyState
      title="Chưa tìm thấy cầu thủ phù hợp."
      description="Thử bỏ bớt bộ lọc."
      action="Xóa bộ lọc"
      actionHref="/cau-thu"
    />
  );
}

export function CatalogError() {
  const router = useRouter();
  return (
    <ErrorState
      title="Chưa tải được danh sách. Thử lại nhé."
      onRetry={() => router.refresh()}
      retryLabel="Thử lại"
    />
  );
}
