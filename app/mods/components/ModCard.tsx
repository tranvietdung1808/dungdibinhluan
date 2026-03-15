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
  const isPortrait = mod.thumbnailOrientation === "portrait";
  
  return (
    <Link href={`/mods/${mod.slug}`}>
      <div
        className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#ce5a67]/40 transition-all bg-[#0d0d18] cursor-pointer ${
          isPortrait ? "flex flex-row h-36" : "flex flex-col"
        }`}
      >
        <div className={`relative flex-shrink-0 overflow-hidden ${isPortrait ? "w-28 h-full" : "h-40 w-full"}`}>
          <Image
            src={mod.thumbnail}
            alt={mod.name}
            fill
            className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 object-center"
          />
          <div className={`absolute inset-0 ${isPortrait ? "bg-gradient-to-r from-transparent via-transparent to-[#0d0d18]" : "bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/20 to-transparent"}`} />
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest"
            style={{
              background: `${TAG_COLORS[mod.tags[0]]}25`,
              color: TAG_COLORS[mod.tags[0]],
              border: `1px solid ${TAG_COLORS[mod.tags[0]]}40`,
            }}
          >
            {mod.category}
          </span>
        </div>
        <div className={`p-4 flex flex-col justify-center space-y-2 ${isPortrait ? "flex-1 min-w-0" : "w-full"}`}>
          <h3 className="font-black text-[15px] leading-snug text-white group-hover:text-[#ce5a67] transition-colors break-words">
            {mod.name}
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">{mod.description}</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 whitespace-nowrap">
              📦 {mod.version}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 whitespace-nowrap">
              📅 {mod.updatedAt}
            </span>
          </div>
          <div className="flex items-center pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-500 truncate">
              by <span className="text-slate-300">{mod.author}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
