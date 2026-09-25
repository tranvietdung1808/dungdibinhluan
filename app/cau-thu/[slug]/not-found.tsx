import { Container, EmptyState } from "@/app/components/ui";

// =====================================================
// 404 cầu thủ — copy §9.4: "Không tìm thấy cầu thủ này.
// Quay lại danh sách."
// =====================================================

export default function PlayerNotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <Container className="py-10 md:py-14">
        <EmptyState
          title="Không tìm thấy cầu thủ này."
          action="Quay lại danh sách"
          actionHref="/cau-thu"
        />
      </Container>
    </main>
  );
}
