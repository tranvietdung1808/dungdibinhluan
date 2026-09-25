import Link from "next/link";
import { formatEurCompact } from "@/lib/players/format";
import type { PlayerListDto } from "@/lib/players/types";
import { PlayerAvatar } from "./PlayerAvatar";

// =====================================================
// PlayerListMobile — mỗi cầu thủ = 1 item <1024px (§9.2)
// Dòng 1: tên + CLB · Dòng 2: vị trí · OVR · POT
// Dòng 3: giá + lương — cùng nhìn thấy, không cuộn ngang.
// =====================================================

export function PlayerListMobile({ players }: { players: PlayerListDto[] }) {
  return (
    <ul className="divide-y divide-[var(--color-line)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] lg:hidden">
      {players.map((p) => (
        <li key={p.slug}>
          <Link
            href={`/cau-thu/${p.slug}`}
            className="flex min-h-[76px] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-2)]/60"
          >
            <PlayerAvatar
              name={p.display_name}
              url={p.avatar_url}
              className="h-10 w-10 text-sm"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-[var(--color-title)]">
                {p.display_name}
                {p.team_name && (
                  <span className="font-normal text-[var(--color-muted)]">
                    {" "}
                    · {p.team_name}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-meta text-[var(--color-muted)]">
                {[p.position_short, `OVR ${p.overall_rating}`, p.potential != null ? `POT ${p.potential}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="mt-0.5 block text-meta">
                <span className="tabular font-semibold text-[var(--color-title)]">
                  {formatEurCompact(p.reference_value_eur)}
                </span>
                <span className="text-[var(--color-muted)]">{" · "}</span>
                <span className="tabular text-[var(--color-body)]">
                  {p.weekly_wage_eur != null
                    ? `${formatEurCompact(p.weekly_wage_eur)}/tuần`
                    : "Chưa có"}
                </span>
              </span>
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-[var(--color-muted)]"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
