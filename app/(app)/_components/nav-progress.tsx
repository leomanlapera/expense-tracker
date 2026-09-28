"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Thin top-of-page progress bar during Next router transitions.
 * Kicks off on pathname/search change, animates to 90%, snaps to 100%
 * once the new tree has rendered, then fades out. No lib.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams?.toString() ?? ""}`;

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Kick off via microtask — keeps setState out of the effect body proper.
    const t0 = setTimeout(() => {
      setVisible(true);
      setProgress(20);
    }, 0);
    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(90), 240);
    const t3 = setTimeout(() => setProgress(100), 400);
    const t4 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 640);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [key]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full bg-[color:var(--color-accent)]"
        style={{ width: `${progress}%`, transition: "width 200ms ease-out" }}
      />
    </div>
  );
}
