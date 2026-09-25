import Link from "next/link";
import { formatEurCompact } from "@/lib/players/format";
import type { PlayerListDto } from "@/lib/players/types";
import { PlayerAvatar } from "./PlayerAvatar";
import styles from "../players.module.css";

// =====================================================
// PlayersTable — bảng cố định desktop ≥1024px (§9.1)
// Cầu thủ / CLB | Vị trí | Tổng quát | Tiềm năng | Giá tham khảo | Lương/tuần
// =====================================================

const thClass =
  "px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] whitespace-nowrap";
const thRight = `${thClass} text-right`;
const tdClass = "px-4 py-3 whitespace-nowrap align-middle";
const tdRight = `${tdClass} text-right tabular`;

export function PlayersTable({ players }: { players: PlayerListDto[] }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] lg:block">
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-[var(--color-line-strong)] text-left">
            <th scope="col" className={thClass}>
              Cầu thủ / CLB
            </th>
            <th scope="col" className={thClass}>
              Vị trí
            </th>
            <th scope="col" className={thRight}>
              Tổng quát
            </th>
            <th scope="col" className={thRight}>
              Tiềm năng
            </th>
            <th scope="col" className={thRight}>
              Giá tham khảo
            </th>
            <th scope="col" className={thRight}>
              Lương/tuần
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={p.slug}
              className={`${styles.tableRow} border-b border-[var(--color-line)] transition-colors last:border-0 hover:bg-[var(--color-surface-2)]/60`}
            >
              <td className={tdClass}>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={p.display_name}
                    url={p.avatar_url}
                    className="h-9 w-9 text-xs"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/cau-thu/${p.slug}`}
                      className="block truncate font-semibold text-[var(--color-title)] transition-colors hover:text-[var(--color-accent-strong)]"
                    >
                      {p.display_name}
                    </Link>
                    <p className="truncate text-meta text-[var(--color-muted)]">
                      {p.team_name ?? "—"}
                    </p>
                  </div>
                </div>
              </td>
              <td className={`${tdClass} text-[var(--color-body)]`}>
                {p.position_short ?? "—"}
              </td>
              <td className={`${tdRight} font-bold text-[var(--color-title)]`}>
                {p.overall_rating}
              </td>
              <td className={`${tdRight} text-[var(--color-body)]`}>
                {p.potential ?? "Chưa có"}
              </td>
              <td className={`${tdRight} font-medium text-[var(--color-title)]`}>
                {formatEurCompact(p.reference_value_eur)}
              </td>
              <td className={`${tdRight} text-[var(--color-body)]`}>
                {p.weekly_wage_eur != null
                  ? `${formatEurCompact(p.weekly_wage_eur)}/tuần`
                  : "Chưa có"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
