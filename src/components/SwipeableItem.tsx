"use client";

import { useRef, useState, useCallback } from "react";

interface SwipeableItemProps {
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  threshold?: number;
}

export default function SwipeableItem({
  children,
  rightAction,
  threshold = 80,
}: SwipeableItemProps) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const locked = useRef(false);
  const dirLocked = useRef<"h" | "v" | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    dirLocked.current = null;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swiping) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (!dirLocked.current) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
          dirLocked.current = "v";
          setSwiping(false);
          return;
        }
        if (Math.abs(dx) > 5) {
          dirLocked.current = "h";
        }
      }

      if (dirLocked.current !== "h") return;

      const clamped = Math.max(dx, -threshold * 1.2);
      currentX.current = clamped;
      setOffsetX(clamped < 0 ? clamped : 0);
    },
    [swiping, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (currentX.current < -threshold) {
      setOffsetX(-threshold);
    } else {
      setOffsetX(0);
    }
    currentX.current = 0;
  }, [threshold]);

  // Close on tap when revealed
  const handleContentClick = useCallback(() => {
    if (offsetX < 0) {
      setOffsetX(0);
    }
  }, [offsetX]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {rightAction && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-3">
          {rightAction}
        </div>
      )}
      <div
        className={`relative ${swiping ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
}
