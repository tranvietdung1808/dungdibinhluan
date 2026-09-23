import { MOD_FILTER_TAGS } from "@/lib/catalog";

interface FilterTagsProps {
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export default function FilterTags({ activeTag, onTagChange }: FilterTagsProps) {
  return (
    <div
      role="group"
      aria-label="Lọc theo danh mục mod"
      className="flex flex-wrap items-center gap-2"
    >
      {MOD_FILTER_TAGS.map((tag) => {
        const active = tag === activeTag;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            onClick={() => onTagChange(tag)}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors ${
              active
                ? "border-transparent bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-body)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-title)]"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
