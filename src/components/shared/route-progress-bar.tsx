"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    // Route changed - start progress
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      start();
    }
  }, [pathname, searchParams]);

  function start() {
    setProgress(0);
    setVisible(true);

    // Quickly move to ~30%
    setTimeout(() => setProgress(30), 50);
    // Slowly creep to ~70%
    timerRef.current = setTimeout(() => setProgress(70), 300);
    // Then finish after a short delay
    setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 500);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-accent via-secondary to-accent rounded-r-full transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : progress > 50 ? "800ms" : "300ms",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Shimmer glow at the tip */}
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-white/40 to-transparent" />
      </div>
    </div>
  );
}
