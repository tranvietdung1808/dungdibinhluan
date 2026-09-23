"use client";

import { useState } from "react";

// =====================================================
// VimeoClickPlay — video demo dạng click-to-play (§11):
// poster tĩnh + nút play; iframe Vimeo CHỈ được mount sau
// khi user bấm → không auto-load/auto-play, không tốn
// băng thông khi chưa cần.
// =====================================================

interface VimeoClickPlayProps {
  videoId: string;
  title?: string;
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-7 w-7 translate-x-0.5"
    >
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.02 1.02 0 0 0 0-1.76L9.56 4.26A1.02 1.02 0 0 0 8 5.14Z" />
    </svg>
  );
}

export default function VimeoClickPlay({
  videoId,
  title = "Video demo MIX MODS FC 26",
}: VimeoClickPlayProps) {
  const [playing, setPlaying] = useState(false);
  const [posterBroken, setPosterBroken] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-[var(--color-line)] bg-black shadow-[var(--shadow-ambient)]">
      {playing ? (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Phát video: ${title}`}
          className="group absolute inset-0 flex h-full w-full items-center justify-center"
        >
          {/* Poster Vimeo (vumbnail CDN) — lỗi thì chỉ còn nền gradient */}
          {!posterBroken && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`https://vumbnail.com/${videoId}.jpg`}
              alt=""
              aria-hidden="true"
              loading="lazy"
              onError={() => setPosterBroken(true)}
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-80"
            />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30"
          />
          <span
            aria-hidden="true"
            className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-lg transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105 md:h-20 md:w-20"
          >
            <PlayIcon />
          </span>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-meta text-white backdrop-blur-sm">
            Bấm để phát video demo
          </span>
        </button>
      )}
    </div>
  );
}
