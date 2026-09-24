"use client";

import { useState } from "react";
import Link from "next/link";
import { GAMES } from "../../data/games";
import { PRODUCTS } from "@/lib/payment/config";
import { SUPPORT_URL } from "@/lib/payment/order-status";
import {
  Badge,
  Button,
  Card,
  Field,
  InlineNotice,
  inputClass,
} from "../../components/ui";
import { DownloadFileCard } from "../components/DownloadFileCard";

const game = GAMES.find((item) => item.slug === "fc27")!;
const product = PRODUCTS["fc27-standard"];

function CodeEntry({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) {
      setError("Vui lòng nhập mã truy cập FC 27.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value, productId: product.id }),
      });
      const data = (await response.json().catch(() => null)) as {
        valid?: boolean;
        message?: string;
      } | null;

      if (response.status === 429) {
        setError(
          data?.message ?? "Bạn thử mã quá nhiều lần, vui lòng thử lại sau.",
        );
      } else if (!response.ok) {
        setError("Chưa kiểm tra được mã, vui lòng thử lại.");
      } else if (data?.valid) {
        onSuccess();
      } else {
        setError("Mã không đúng, không thuộc FC 27 hoặc đã hết hạn.");
      }
    } catch {
      setError("Mất kết nối. Mã của bạn vẫn được giữ để thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2 text-center">
          <Badge tone="accent">EA FC 27 đã ra mắt</Badge>
          <h1 className="text-h2 text-[var(--color-title)]">
            Mở khu tải FC 27
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Nhập mã FC 27 được gửi qua email sau khi thanh toán.
          </p>
        </div>

        <Field
          label="Mã truy cập FC 27"
          hint="Định dạng: FC27-XXXX-XXXX"
          error={error}
          required
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              value={code}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="FC27-XXXX-XXXX"
              className={`${inputClass} text-center font-mono tracking-widest`}
            />
          )}
        </Field>

        <Button type="submit" loading={loading} size="lg" fullWidth>
          Xác thực & mở khu tải
        </Button>

        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-line)] pt-4">
          <Link
            href="/games/fc27/select"
            className="text-sm font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
          >
            Chưa có mã? Mua FC 27 — 180.000đ →
          </Link>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-meta text-[var(--color-muted)] hover:text-[var(--color-body)]"
          >
            Cần hỗ trợ? Nhắn fanpage ↗
          </a>
        </div>
      </form>
    </Card>
  );
}

function DownloadArea() {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <header className="space-y-2 text-center">
        <div className="flex justify-center">
          <Badge tone="success">Mã FC 27 hợp lệ</Badge>
        </div>
        <h1 className="text-h2 text-[var(--color-title)]">{product.name}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Bấm “Tạo link tải” để nhận liên kết có hiệu lực trong một giờ.
        </p>
      </header>

      <section aria-label="Danh sách file FC 27" className="space-y-4">
        {(game.files ?? []).map((file) => (
          <DownloadFileCard key={file.id} file={file} />
        ))}
      </section>

      <InlineNotice tone="warning" title="Lưu ý khi tải file lớn">
        Link tải có hiệu lực trong một giờ. Nên dùng IDM hoặc Neat Download
        Manager để tránh gián đoạn khi mạng không ổn định.
      </InlineNotice>

      <Card>
        <h2 className="text-h3 text-[var(--color-title)]">Hướng dẫn cài đặt</h2>
        <ol className="mt-3 space-y-2 text-sm text-[var(--color-body)]">
          <li>
            1. Tạo link và tải bộ cài FC 27 bằng IDM hoặc Neat Download Manager.
          </li>
          <li>2. Tải ClientTool và làm theo hướng dẫn đi kèm.</li>
          <li>
            3. Gặp lỗi? Nhắn{" "}
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
        </ol>
      </Card>
    </div>
  );
}

export default function FC27Page() {
  const [verified, setVerified] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      {verified ? (
        <DownloadArea />
      ) : (
        <CodeEntry onSuccess={() => setVerified(true)} />
      )}
    </main>
  );
}
