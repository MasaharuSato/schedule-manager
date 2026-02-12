"use client";

import { useRef, useEffect } from "react";

export function useEdgeSwipeBack(onBack: () => void) {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      if (e.touches[0].clientX < 20) {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (startX.current === 0) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
      if (dx > 80 && dy < 50) {
        onBack();
      }
      startX.current = 0;
    };

    document.addEventListener("touchstart", handleStart, { passive: true });
    document.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleStart);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [onBack]);
}
