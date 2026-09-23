// =====================================================
// /games/fc26/download — trung tâm tải bản Standard (B10/§12.4)
// Link tải chỉ được tạo khi bấm nút (lazy) — mỗi file một
// trạng thái riêng, lỗi file này không khóa file khác.
// =====================================================

import Link from "next/link";
import { GAMES } from "../../../data/games";
import { SUPPORT_URL } from "@/lib/payment/order-status";
import { Card, Container, InlineNotice } from "../../../components/ui";
import { DownloadFileCard } from "../../components/DownloadFileCard";

const game = GAMES.find((g) => g.slug === "fc26")!;
const files = (game.files ?? []).filter((f) => !f.modsOnly);

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      <Container className="max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-h2 text-[var(--color-title)]">Tải EA FC 26</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Bản Standard — bấm “Tạo link tải” để nhận liên kết tải cho từng file.
          </p>
        </header>

        <section aria-label="Danh sách file tải" className="space-y-4">
          {files.map((file) => (
            <DownloadFileCard key={file.id} file={file} />
          ))}
        </section>

        {/* Hướng dẫn + hỗ trợ — SAU vùng tải */}
        <InlineNotice tone="warning" title={`Lưu ý khi tải file lớn (${game.fileSize})`}>
          File game nặng — nên tải bằng IDM hoặc Neat Download Manager để tránh
          lỗi khi mạng chập chờn.
        </InlineNotice>

        <Card>
          <h2 className="text-h3 text-[var(--color-title)]">Hướng dẫn & hỗ trợ</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-body)]">
            <li>
              <a
                href="https://www.youtube.com/watch?v=wOuYBJcY0k0"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
              >
                Video hướng dẫn cài đặt bằng ClientTool ↗
              </a>
            </li>
            <li>
              Link hết hạn hoặc lỗi khi cài? Nhắn{" "}
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
              >
                fanpage hỗ trợ ↗
              </a>
              .
            </li>
          </ul>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-meta text-[var(--color-muted)] transition-colors hover:text-[var(--color-body)]"
          >
            ← Về trang chủ
          </Link>
        </div>
      </Container>
    </main>
  );
}
