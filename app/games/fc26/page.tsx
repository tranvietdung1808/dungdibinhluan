"use client";

// =====================================================
// /games/fc26 — nhập mã truy cập → khu tải theo quyền (§12.4)
// - Heading "Nhập mã truy cập FC 26"; input có label, paste, trim.
// - KHÔNG xóa mã khi lỗi; tách lỗi: không hợp lệ/hết hạn,
//   rate limit (429), lỗi server, mất kết nối.
// - Sau verify: heading theo edition server trả (type), danh sách
//   file theo quyền (modsOnly chỉ hiện cho bản Full Mods).
// - Hướng dẫn cài + hỗ trợ nằm SAU vùng tải.
// =====================================================

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GAMES } from "../../data/games";
import { PRODUCTS, type ProductConfig } from "@/lib/payment/config";
import { SUPPORT_URL } from "@/lib/payment/order-status";
import { Badge, Button, Card, Field, InlineNotice, inputClass } from "../../components/ui";
import { DownloadFileCard } from "../components/DownloadFileCard";

const game = GAMES.find((g) => g.slug === "fc26")!;

type CodeType = "normal" | "mods";

function productForType(type: string): ProductConfig {
  return type === "mods" ? PRODUCTS["fc26-mods"] : PRODUCTS["fc26-normal"];
}

// ========== CODE ENTRY VIEW ==========
function CodeEntryView({
  expectedEdition,
  onSuccess,
}: {
  expectedEdition: string | null;
  onSuccess: (type: CodeType) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const prefixHint = expectedEdition === "mods" ? "MODS-XXXX-XXXX" : "DUNG-XXXX-XXXX";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Vui lòng nhập mã truy cập");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          productId:
            expectedEdition === "mods"
              ? "fc26-mods"
              : expectedEdition === "normal"
                ? "fc26-normal"
                : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            valid?: boolean;
            type?: string;
            productId?: string | null;
            message?: string;
          }
        | null;

      if (res.status === 429) {
        // Rate limit — server có message riêng
        setError(
          data?.message ??
            "Bạn thử mã quá nhiều lần — vui lòng thử lại sau ít phút."
        );
        return;
      }
      if (!res.ok) {
        setError("Chưa kiểm tra được mã — thử lại sau ít phút.");
        return;
      }
      if (data?.valid) {
        if (data.productId && !data.productId.startsWith("fc26-")) {
          setError("Mã này không thuộc sản phẩm FC 26.");
          return;
        }
        onSuccess(data.type === "mods" ? "mods" : "normal");
        return;
      }
      // Mã sai hoặc đã hết hạn (mã có hiệu lực 24h sau khi cấp)
      setError(
        data?.message ??
          "Mã không đúng hoặc đã hết hạn. Mã chỉ có hiệu lực 24 giờ sau khi cấp — nếu đã quá hạn, liên hệ hỗ trợ."
      );
    } catch {
      setError("Mất kết nối — kiểm tra mạng rồi thử lại. Mã của bạn vẫn được giữ nguyên.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5 text-center">
          <h1 className="text-h2 text-[var(--color-title)]">Nhập mã truy cập FC 26</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Nhập mã được gửi qua email sau khi thanh toán để mở khu tải.
          </p>
        </div>

        <Field
          label="Mã truy cập"
          hint={`Định dạng: ${prefixHint} — có thể dán trực tiếp`}
          error={error}
          required
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              type="text"
              value={code}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder={prefixHint}
              className={`${inputClass} text-center font-mono tracking-widest`}
            />
          )}
        </Field>

        <Button type="submit" loading={loading} size="lg" fullWidth>
          Xác thực
        </Button>

        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-line)] pt-4">
          <Link
            href="/games/fc26/select"
            className="text-sm font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
          >
            Chưa có mã? Chọn phiên bản →
          </Link>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-meta text-[var(--color-muted)] transition-colors hover:text-[var(--color-body)]"
          >
            Cần hỗ trợ? Fanpage DungDiBinhLuan ↗
          </a>
        </div>
      </form>
    </Card>
  );
}

// ========== DOWNLOAD VIEW ==========
function DownloadView({ type }: { type: CodeType }) {
  const product = productForType(type);
  const files = (game.files ?? []).filter((f) => type === "mods" || !f.modsOnly);

  return (
    <div className="w-full max-w-2xl space-y-6">
      <header className="space-y-2 text-center">
        <div className="flex justify-center">
          <Badge tone="success">Đã xác thực mã</Badge>
        </div>
        <h1 className="text-h2 text-[var(--color-title)]">{product.name}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {type === "mods"
            ? "Quyền tải: bộ cài game + Full Mods Pack + công cụ cài đặt."
            : "Quyền tải: bộ cài game + công cụ cài đặt."}
        </p>
      </header>

      {/* ===== Vùng tải — mỗi file một trạng thái độc lập ===== */}
      <section aria-label="Danh sách file tải" className="space-y-4">
        {files.map((file) => (
          <DownloadFileCard key={file.id} file={file} />
        ))}
      </section>

      {/* ===== Hướng dẫn + hỗ trợ — SAU vùng tải ===== */}
      <section aria-label="Hướng dẫn cài đặt" className="space-y-4">
        <InlineNotice tone="warning" title={`Lưu ý khi tải file lớn (${game.fileSize})`}>
          <p>
            File game nặng — tải trực tiếp bằng trình duyệt khi mạng chập chờn
            dễ bị ngắt giữa chừng. Khuyến nghị dùng{" "}
            <strong>IDM (Internet Download Manager)</strong> hoặc{" "}
            <strong>Neat Download Manager</strong>.
          </p>
        </InlineNotice>

        <Card>
          <h2 className="text-h3 text-[var(--color-title)]">Hướng dẫn cài đặt</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-body)]">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-[var(--color-accent-strong)]">1.</span>
              Tải file cài đặt (và Full Mods Pack nếu có) bằng link vừa tạo.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-[var(--color-accent-strong)]">2.</span>
              Tải ClientTool rồi làm theo{" "}
              <a
                href="https://www.youtube.com/watch?v=wOuYBJcY0k0"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
              >
                video hướng dẫn cài đặt ↗
              </a>
              .
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-[var(--color-accent-strong)]">3.</span>
              Gặp lỗi khi cài? Nhắn{" "}
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
              >
                fanpage hỗ trợ ↗
              </a>{" "}
              kèm mô tả lỗi.
            </li>
          </ul>
        </Card>
      </section>

      <div className="text-center">
        <Link
          href="/"
          className="text-meta text-[var(--color-muted)] transition-colors hover:text-[var(--color-body)]"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}

// ========== PAGE ==========
function FC26Content() {
  const params = useSearchParams();
  const expectedEdition = params.get("edition");
  const [codeType, setCodeType] = useState<CodeType | null>(null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      {codeType !== null ? (
        <DownloadView type={codeType} />
      ) : (
        <CodeEntryView expectedEdition={expectedEdition} onSuccess={setCodeType} />
      )}
    </main>
  );
}

export default function FC26Page() {
  return (
    <Suspense>
      <FC26Content />
    </Suspense>
  );
}
