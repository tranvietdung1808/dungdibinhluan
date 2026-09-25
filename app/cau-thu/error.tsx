"use client";

import { useEffect } from "react";
import { Container, ErrorState } from "@/app/components/ui";

// =====================================================
// Error boundary segment /cau-thu — copy theo §9.4
// =====================================================

export default function CauThuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <Container className="py-10 md:py-14">
        <ErrorState
          title="Chưa tải được danh sách. Thử lại nhé."
          onRetry={reset}
          retryLabel="Thử lại"
        />
      </Container>
    </main>
  );
}
