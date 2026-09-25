import { Container, Skeleton } from "@/app/components/ui";

// =====================================================
// Skeleton danh bạ — đúng hình dạng: header → toolbar → bảng
// =====================================================

export default function CauThuLoading() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <Container className="py-10 md:py-14">
        {/* Header */}
        <Skeleton className="h-10 w-44" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />

        {/* Toolbar: ô tìm + hàng select */}
        <div className="mt-8 space-y-3">
          <Skeleton className="h-12 w-full" rounded="rounded-[10px]" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" rounded="rounded-[10px]" />
            ))}
          </div>
        </div>

        {/* Bảng: header + 10 hàng ~70px (desktop) / item (mobile) */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
          <div className="hidden border-b border-[var(--color-line-strong)] px-4 py-3.5 lg:block">
            <Skeleton className="h-4 w-2/3" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[70px] items-center gap-3 border-b border-[var(--color-line)] px-4 last:border-0"
            >
              <Skeleton className="h-9 w-9 shrink-0" rounded="rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="hidden h-4 w-16 lg:block" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
