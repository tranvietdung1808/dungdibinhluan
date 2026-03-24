interface FilterTagsProps {
  activeTag: string;
  onTagChange: (tag: string) => void;
}

const ALL_TAGS = ["Tất cả", "Faces", "Kits", "Gameplay", "Đồ họa", "Cơ chế game"];

export default function FilterTags({ activeTag, onTagChange }: FilterTagsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ALL_TAGS.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagChange(tag)}
          className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all border ${
            activeTag === tag
              ? "bg-[#ce5a67] text-white border-[#ce5a67]"
              : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
          }`}
        >
          {tag.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
