import Link from "next/link";
import { GAMES } from "../../../data/games";
import { SUPPORT_URL } from "@/lib/payment/order-status";
import { Card, Container, InlineNotice } from "../../../components/ui";
import { DownloadFileCard } from "../../components/DownloadFileCard";

const game = GAMES.find((item) => item.slug === "fc27")!;

export default function FC27DownloadPage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      <Container className="max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-h2 text-[var(--color-title)]">Tải EA FC 27</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Khu tải yêu cầu phiên truy cập được tạo sau khi nhập mã FC 27 hợp
            lệ.
          </p>
        </header>

        <section aria-label="Danh sách file FC 27" className="space-y-4">
          {(game.files ?? []).map((file) => (
            <DownloadFileCard key={file.id} file={file} />
          ))}
        </section>

        <InlineNotice tone="neutral">
          Nếu hệ thống báo chưa có quyền truy cập, hãy quay lại trang nhập mã FC
          27 trước.
        </InlineNotice>

        <Card>
          <h2 className="text-h3 text-[var(--color-title)]">Hỗ trợ</h2>
          <p className="mt-2 text-sm text-[var(--color-body)]">
            Link hết hạn hoặc gặp lỗi cài đặt? Nhắn{" "}
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
            >
              fanpage hỗ trợ ↗
            </a>
            .
          </p>
        </Card>

        <div className="text-center">
          <Link
            href="/games/fc27"
            className="text-sm font-semibold text-[var(--color-accent-strong)]"
          >
            ← Nhập mã FC 27
          </Link>
        </div>
      </Container>
    </main>
  );
}
