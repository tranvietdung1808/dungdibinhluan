import Image from "next/image";
import Link from "next/link";

const TAG_COLORS: Record<string, string> = {
  Faces: "#3b82f6",
  Kits: "#8b5cf6",
  Gameplay: "#10b981",
  "Đồ họa": "#f59e0b",
  "Cơ chế game": "#ce5a67",
};

interface FeaturedModCardProps {
  mod: {
    slug: string;
    name: string;
    description: string;
    thumbnail: string;
    category: string;
    tags: string[];
    downloadUrl?: string;
  };
}

export default function FeaturedModCard({ mod }: FeaturedModCardProps) {
  return (
    <Link href={`/mods/${mod.slug}`}>
      <div
        className="group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
        style={{
          border: "1px solid rgba(206,90,103,0.45)",
          boxShadow: "0 0 0 1px rgba(206,90,103,0.14), 0 20px 65px rgba(0,0,0,0.62)",
        }}
      >
        {/* Đường accent đỏ trên cùng card */}
        <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{ background: "linear-gradient(90deg, transparent 5%, rgba(206,90,103,0.7) 50%, transparent 95%)" }}
        />

        <div className="relative h-60 md:h-72 lg:h-80">
          <Image
            src={mod.thumbnail}
            alt={mod.name}
            fill
            className="object-cover opacity-90 group-hover:opacity-95 group-hover:scale-[1.04] transition-all duration-500"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(8,8,16,0.70) 22%, rgba(8,8,16,0.30) 50%, rgba(8,8,16,0.02) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,8,16,0.75) 0%, rgba(8,8,16,0.25) 30%, transparent 58%)" }} />

          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#ce5a67] text-white">
              ⭐ FEATURED
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-white/8 text-white/80 border border-white/15">
              {mod.category}
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#ce5a67]/80 font-bold mb-1">Bản mod nổi bật</p>
          <h2 className="text-xl md:text-3xl font-black leading-tight text-white group-hover:text-[#ce5a67] transition-colors duration-300">
            {mod.name}
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed line-clamp-2">{mod.description}</p>
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            {mod.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: `${TAG_COLORS[tag]}18`,
                  color: TAG_COLORS[tag],
                  border: `1px solid ${TAG_COLORS[tag]}28`,
                }}
              >
                {tag}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-slate-300 font-bold tracking-widest group-hover:text-white transition-colors">
              XEM CHI TIẾT →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
