"use client";

import { useState } from "react";
import type { GameFile } from "@/app/data/games";
import { Button, InlineNotice } from "@/app/components/ui";

// =====================================================
// DownloadFileCard — một file = một state machine độc lập (B10/T16)
//   idle → creating → ready → expired
//                 ↘ error (retry không khóa các file khác)
// - Mọi fetch kiểm tra response.ok + catch network.
// - Không render <a> khi chưa có URL thật; không ghi "đã tải xong"
//   khi mới chỉ mở link.
// - Link presigned có hạn ~1h → hết hạn hiện "Tạo liên kết mới".
// =====================================================

/** Presigned URL có hạn 1 giờ — trừ hao 5 phút cho an toàn */
const LINK_TTL_MS = 55 * 60 * 1000;

type LinkState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "ready"; url: string; expiresAt: number }
  | { status: "expired" }
  | { status: "error"; message: string };

async function requestLink(endpoint: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(endpoint, { cache: "no-store" });
  } catch {
    throw new Error("Mất kết nối — kiểm tra mạng rồi thử lại.");
  }

  const data = (await res.json().catch(() => null)) as
    | { url?: unknown; error?: unknown }
    | null;

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Bạn tạo liên kết quá nhiều lần — vui lòng thử lại sau ít phút.");
    }
    const serverMsg = data && typeof data.error === "string" ? data.error : null;
    throw new Error(serverMsg ?? `Chưa tạo được liên kết (lỗi ${res.status}) — thử lại.`);
  }

  if (!data || typeof data.url !== "string" || !data.url) {
    throw new Error("Chưa tạo được liên kết — thử lại.");
  }
  return data.url;
}

export function DownloadFileCard({ file }: { file: GameFile }) {
  const [state, setState] = useState<LinkState>({ status: "idle" });

  const createLink = async () => {
    setState({ status: "creating" });
    try {
      const url = await requestLink(file.endpoint);
      setState({ status: "ready", url, expiresAt: Date.now() + LINK_TTL_MS });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Chưa tạo được liên kết — thử lại.",
      });
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-[var(--color-title)]">{file.name}</p>
          <p className="text-meta text-[var(--color-muted)]">
            {file.kind}
            {file.size ? ` · ${file.size}` : ""}
            {file.version ? ` · ${file.version}` : ""}
          </p>
          {file.note && (
            <p className="text-meta leading-relaxed text-[var(--color-muted)]">{file.note}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {state.status === "idle" && (
          <Button onClick={createLink} fullWidth>
            Tạo link tải
          </Button>
        )}

        {state.status === "creating" && (
          <Button loading fullWidth aria-live="polite">
            Đang tạo liên kết
          </Button>
        )}

        {state.status === "ready" && (
          <>
            {/* Chỉ render anchor khi đã có URL thật */}
            <a
              href={state.url}
              onClick={(e) => {
                if (Date.now() > state.expiresAt) {
                  e.preventDefault();
                  setState({ status: "expired" });
                }
              }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--color-accent)] px-6 text-base font-semibold text-[var(--color-on-accent)] transition-colors duration-150 hover:bg-[var(--color-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Mở link tải
            </a>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-meta text-[var(--color-muted)]">
                Liên kết có hiệu lực khoảng 1 giờ
              </p>
              <button
                type="button"
                onClick={createLink}
                className="text-meta font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
              >
                Tạo lại liên kết
              </button>
            </div>
          </>
        )}

        {state.status === "expired" && (
          <>
            <InlineNotice tone="warning">Liên kết này đã hết hạn.</InlineNotice>
            <Button onClick={createLink} variant="secondary" fullWidth>
              Tạo liên kết mới
            </Button>
          </>
        )}

        {state.status === "error" && (
          <>
            <InlineNotice tone="danger">{state.message}</InlineNotice>
            <Button onClick={createLink} variant="secondary" fullWidth>
              Thử lại
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
