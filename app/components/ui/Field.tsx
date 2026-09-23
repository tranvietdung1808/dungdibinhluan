import { useId, type ReactNode } from "react";

// =====================================================
// Field — label + hint + error wiring đúng aria
// Dùng: <Field label="Email" error={err} hint="...">{(id) => <input id={id}/>}</Field>
// hoặc truyền input trực tiếp qua children kèm inputProps tự quản.
// =====================================================

export function Field({
  label,
  hint,
  error,
  required = false,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Nhận (id, describedBy) để gắn vào input thật */
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}) {
  const autoId = useId();
  const id = `f-${autoId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--color-title)]"
      >
        {label}
        {required && (
          <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-[var(--color-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Style chuẩn cho input/textarea/select — input cao 48px
export const inputClass =
  "w-full h-12 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-[15px] text-[var(--color-title)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent-border)] focus:outline-none disabled:opacity-50 aria-[invalid=true]:border-[var(--color-danger)]";

export const textareaClass =
  "w-full min-h-[120px] rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-[15px] text-[var(--color-title)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent-border)] focus:outline-none disabled:opacity-50 aria-[invalid=true]:border-[var(--color-danger)]";
