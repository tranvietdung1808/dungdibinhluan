"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitioningRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    clearTimers();
    setVisible(true);
    setProgress(12);
    intervalRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const step = Math.max(1, (92 - current) * 0.09);
        return Math.min(92, current + step);
      });
    }, 120);
  }, [clearTimers]);

  const finishLoading = useCallback(() => {
    if (!transitioningRef.current) return;
    clearTimers();
    setProgress(100);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      transitioningRef.current = false;
    }, 240);
  }, [clearTimers]);

  useEffect(() => {
    const nextQuery = searchParams.toString();
    void pathname;
    void nextQuery;
    const rafId = window.requestAnimationFrame(() => {
      finishLoading();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [pathname, searchParams, finishLoading]);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }
      let targetUrl: URL;
      try {
        targetUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (targetUrl.origin !== window.location.origin) return;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = `${targetUrl.pathname}${targetUrl.search}`;
      if (currentPath === nextPath) return;
      startLoading();
    };

    const onPopState = () => startLoading();

    document.addEventListener("click", onClickCapture, true);
    window.addEventListener("popstate", onPopState);

    if (document.readyState !== "complete") {
      const startRafId = window.requestAnimationFrame(() => {
        startLoading();
      });
      const onLoad = () => {
        window.requestAnimationFrame(() => finishLoading());
      };
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        window.cancelAnimationFrame(startRafId);
        document.removeEventListener("click", onClickCapture, true);
        window.removeEventListener("popstate", onPopState);
        window.removeEventListener("load", onLoad);
        clearTimers();
      };
    }

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [clearTimers, finishLoading, startLoading]);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-1 w-full transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <div
        className="relative h-full origin-left will-change-transform"
        style={{
          transform: `translateZ(0) scaleX(${progress / 100})`,
          background:
            "linear-gradient(90deg, rgba(206,90,103,0.2) 0%, var(--accent) 42%, #f48ca0 64%, var(--accent) 100%)",
          boxShadow: "0 0 18px rgba(206,90,103,0.55)",
          transition: progress === 100 ? "transform 220ms ease-out" : "transform 120ms linear",
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-progress-sheen absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/65 to-transparent" />
        </div>
      </div>
    </div>
  );
}
