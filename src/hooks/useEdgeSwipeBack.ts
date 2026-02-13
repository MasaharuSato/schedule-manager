"use client";

import { useRef, useEffect } from "react";

const EDGE_ZONE = 40; // px — wider zone for reliable detection

export function useEdgeSwipeBack(onBack: (() => void) | null) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isEdge = useRef(false);
  const locked = useRef(false); // true once committed to horizontal edge swipe

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      if (e.touches[0].clientX < EDGE_ZONE) {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isEdge.current = true;
        locked.current = false;
      } else {
        isEdge.current = false;
        locked.current = false;
      }
    };

    /*
     * Non-passive + capture: intercepts the touch event before any child
     * handler (BottomNav links, SwipeableItem, etc.) can process it.
     * preventDefault blocks both browser back-swipe and tab navigation.
     */
    const handleMove = (e: TouchEvent) => {
      if (!isEdge.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = Math.abs(e.touches[0].clientY - startY.current);

      /* If clearly vertical before locking, release edge */
      if (!locked.current && dy > 10 && dy > dx * 2) {
        isEdge.current = false;
        return;
      }

      /* Lock and prevent as soon as any rightward movement (>2px) */
      if (dx > 2) {
        locked.current = true;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (!isEdge.current || !locked.current) {
        isEdge.current = false;
        locked.current = false;
        return;
      }
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
      if (dx > 80 && dy < 50 && onBack) {
        onBack();
      }
      /* Prevent click synthesis on BottomNav links */
      e.preventDefault();
      e.stopPropagation();
      isEdge.current = false;
      locked.current = false;
      startX.current = 0;
    };

    document.addEventListener("touchstart", handleStart, { passive: true });
    document.addEventListener("touchmove", handleMove, { passive: false, capture: true });
    document.addEventListener("touchend", handleEnd, { passive: false, capture: true });
    return () => {
      document.removeEventListener("touchstart", handleStart);
      document.removeEventListener("touchmove", handleMove, { capture: true });
      document.removeEventListener("touchend", handleEnd, { capture: true });
    };
  }, [onBack]);
}
