import Image from "next/image";
import Link from "next/link";

const TAG_COLORS: Record<string, string> = {
  Faces: "#3b82f6",
  Kits: "#8b5cf6",
  Gameplay: "#10b981",
  "Đồ họa": "#f59e0b",
  "Cơ chế game": "#ce5a67",
};

interface ModCardProps {
  mod: {
    slug: string;
    name: string;
    description: string;
    thumbnail: string;
    category: string;
    version: string;
    updatedAt: string;
    author: string;
    thumbnailOrientation?: string;
    tags: string[];
  };
}

export default function ModCard({ mod }: ModCardProps) {
  const isPortrait = mod.thumbnailOrientation !== "landscape";

  return (
    <Link href={`/mods/${mod.slug}`}>
      <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0f] hover:border-[#ce5a67]/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(206,90,103,0.15)] transition-all duration-300 flex flex-col h-full cursor-pointer isolate">

        {/* Đường sáng viền trên cùng chìm */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

        {/* Liên kết chìm (Shrink text) */}
        <div className="relative w-full aspect-[16/10] flex-shrink-0 bg-[#08080a] overflow-hidden">
          {/* Lớp mờ (Blurred Backdrop) phía sau cho ảnh dọc để không bị viền đen */}
          {isPortrait && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <Image
                src={mod.thumbnail}
                alt={mod.name}
                fill
                className="object-cover blur-xl opacity-40 scale-125"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80" />
            </div>
          )}

          {/* Ảnh chính */}
          <div className="absolute inset-0 flex items-center justify-center z-10 w-full h-full">
            <Image
              src={mod.thumbnail}
              alt={mod.name}
              fill
              className={`opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-transform duration-700 ${isPortrait ? "object-contain py-2 object-bottom" : "object-cover object-top"}`}
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>

          {isPortrait && (
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(10,10,15,0) 48%, rgba(10,10,15,0.82) 100%)",
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10" />

          <span
            className="absolute top-3 left-3 z-20 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest backdrop-blur-md shadow-md"
            style={{
              background: `${TAG_COLORS[mod.tags[0]]}1A`, // 10% opacity
              color: TAG_COLORS[mod.tags[0]],
              border: `1px solid ${TAG_COLORS[mod.tags[0]]}4D`, // 30% opacity
            }}
          >
            {mod.category}
          </span>
        </div>

        {/* Khung nội dung Information */}
        <div className="p-3.5 md:p-4 flex flex-col flex-1 relative z-20 -mt-5 pt-4 bg-gradient-to-b from-transparent to-[#0a0a0f]">
          <h3 className="font-black text-xs md:text-sm leading-snug text-white group-hover:text-[#ce5a67] transition-colors line-clamp-2 mb-1">
            {mod.name}
          </h3>
          <p className="text-slate-400 text-[10px] md:text-[11px] leading-relaxed line-clamp-2 mb-3 flex-1">{mod.description}</p>

          {/* Metadata Badges */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300 font-bold tracking-widest flex items-center gap-1 uppercase">
              <span className="text-slate-500">v</span>{mod.version}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300 font-bold tracking-widest flex items-center gap-1 uppercase">
              <span className="text-[#ce5a67] text-[7px]">●</span>{mod.updatedAt}
            </span>
          </div>

          {/* Footer Card */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
              MOD BY <span className="text-slate-200 ml-1">{mod.author}</span>
            </span>
            <span className="text-[#ce5a67] opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
