import type { ReactNode } from "react";

// =====================================================
// Container — public 1200px; wide cho catalog/admin
// =====================================================

export function Container({
  wide = false,
  className = "",
  children,
}: {
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-5 lg:px-8 ${
        wide ? "max-w-[1440px]" : "max-w-[1200px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
