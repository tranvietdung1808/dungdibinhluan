interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Trước
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isNear = Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages;
        if (!isNear) {
          if (p === currentPage - 3 || p === currentPage + 3) {
            return <span key={p} className="text-slate-600 text-xs px-1">…</span>;
          }
          return null;
        }
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl text-xs font-black border transition-all ${
              p === currentPage
                ? "bg-[#ce5a67] text-white border-[#ce5a67]"
                : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Tiếp →
      </button>
    </div>
  );
}
