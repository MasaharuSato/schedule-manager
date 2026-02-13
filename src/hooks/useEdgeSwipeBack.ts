"use client";

import { useRef, useEffect } from "react";

export function useEdgeSwipeBack(onBack: (() => void) | null) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isEdge = useRef(false);

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      if (e.touches[0].clientX < 24) {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isEdge.current = true;
      } else {
        isEdge.current = false;
      }
    };

    /* Non-passive: preventDefault blocks browser's native back-swipe */
    const handleMove = (e: TouchEvent) => {
      if (!isEdge.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = Math.abs(e.touches[0].clientY - startY.current);
      if (dx > 10 && dy < dx) {
        e.preventDefault();
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (!isEdge.current) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
      if (dx > 80 && dy < 50 && onBack) {
        onBack();
      }
      isEdge.current = false;
      startX.current = 0;
    };

    document.addEventListener("touchstart", handleStart, { passive: true });
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleStart);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [onBack]);
}
