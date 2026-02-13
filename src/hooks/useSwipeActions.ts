"use client";

import { useRef, useEffect, useCallback } from "react";

interface SwipeActionsConfig {
  leftRevealWidth?: number;
  rightRevealWidth?: number;
  openThreshold?: number;
  closeThreshold?: number;
}

export function useSwipeActions(config: SwipeActionsConfig) {
  const {
    leftRevealWidth = 0,
    rightRevealWidth = 0,
    openThreshold = 60,
    closeThreshold = 40,
  } = config;

  const contentRef = useRef<HTMLDivElement>(null);
  const leftActionsRef = useRef<HTMLDivElement>(null);
  const rightActionsRef = useRef<HTMLDivElement>(null);
  const didSwipeRef = useRef(false);

  const sx = useRef(0);
  const sy = useRef(0);
  const offset = useRef(0);
  const dir = useRef<"h" | "v" | null>(null);
  const swipeDir = useRef<"left" | "right" | null>(null);
  const revealed = useRef<"left" | "right" | null>(null);

  const transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";

  const close = useCallback(() => {
    const c = contentRef.current;
    if (!c) return;
    c.style.transition = transition;
    c.style.transform = "translate3d(0,0,0)";
    offset.current = 0;
    const wasRevealed = revealed.current;
    revealed.current = null;
    setTimeout(() => {
      if (!revealed.current) {
        if (leftActionsRef.current) leftActionsRef.current.style.visibility = "hidden";
        if (rightActionsRef.current) rightActionsRef.current.style.visibility = "hidden";
      }
    }, 300);
    return wasRevealed;
  }, []);

  useEffect(() => {
    const c = contentRef.current;
    if (!c) return;

    const onStart = (e: TouchEvent) => {
      sx.current = e.touches[0].clientX;
      sy.current = e.touches[0].clientY;
      dir.current = null;
      swipeDir.current = null;
      didSwipeRef.current = false;
      c.style.transition = "none";
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - sx.current;
      const dy = e.touches[0].clientY - sy.current;

      if (!dir.current) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
          dir.current = "v";
          return;
        }
        if (Math.abs(dx) > 5) {
          dir.current = "h";
          // If already revealed, swiping in closing direction
          if (revealed.current) {
            swipeDir.current = revealed.current === "left" ? "left" : "right";
          } else {
            swipeDir.current = dx > 0 ? "right" : "left";
          }
        }
      }
      if (dir.current !== "h") return;

      didSwipeRef.current = true;

      const base = revealed.current === "left"
        ? leftRevealWidth
        : revealed.current === "right"
          ? -rightRevealWidth
          : 0;

      let raw = base + dx;

      // Clamp based on available actions
      if (leftRevealWidth > 0 && raw > 0) {
        raw = Math.min(raw, leftRevealWidth * 1.08);
        if (leftActionsRef.current) leftActionsRef.current.style.visibility = "visible";
      } else if (raw > 0 && leftRevealWidth === 0) {
        raw = 0;
      }

      if (rightRevealWidth > 0 && raw < 0) {
        raw = Math.max(raw, -rightRevealWidth * 1.08);
        if (rightActionsRef.current) rightActionsRef.current.style.visibility = "visible";
      } else if (raw < 0 && rightRevealWidth === 0) {
        raw = 0;
      }

      offset.current = raw;
      c.style.transform = `translate3d(${raw}px,0,0)`;
    };

    const onEnd = () => {
      c.style.transition = transition;
      const off = offset.current;

      if (revealed.current === "left") {
        // Currently showing left actions
        if (off < leftRevealWidth - closeThreshold) {
          // Close
          offset.current = 0;
          revealed.current = null;
          c.style.transform = "translate3d(0,0,0)";
          setTimeout(() => {
            if (!revealed.current && leftActionsRef.current)
              leftActionsRef.current.style.visibility = "hidden";
          }, 300);
        } else {
          offset.current = leftRevealWidth;
          c.style.transform = `translate3d(${leftRevealWidth}px,0,0)`;
        }
      } else if (revealed.current === "right") {
        // Currently showing right actions
        if (off > -(rightRevealWidth - closeThreshold)) {
          offset.current = 0;
          revealed.current = null;
          c.style.transform = "translate3d(0,0,0)";
          setTimeout(() => {
            if (!revealed.current && rightActionsRef.current)
              rightActionsRef.current.style.visibility = "hidden";
          }, 300);
        } else {
          offset.current = -rightRevealWidth;
          c.style.transform = `translate3d(${-rightRevealWidth}px,0,0)`;
        }
      } else {
        // Not revealed — check if should open
        if (off > openThreshold && leftRevealWidth > 0) {
          offset.current = leftRevealWidth;
          revealed.current = "left";
          c.style.transform = `translate3d(${leftRevealWidth}px,0,0)`;
        } else if (off < -openThreshold && rightRevealWidth > 0) {
          offset.current = -rightRevealWidth;
          revealed.current = "right";
          c.style.transform = `translate3d(${-rightRevealWidth}px,0,0)`;
        } else {
          offset.current = 0;
          c.style.transform = "translate3d(0,0,0)";
          setTimeout(() => {
            if (!revealed.current) {
              if (leftActionsRef.current) leftActionsRef.current.style.visibility = "hidden";
              if (rightActionsRef.current) rightActionsRef.current.style.visibility = "hidden";
            }
          }, 300);
        }
      }
    };

    c.addEventListener("touchstart", onStart, { passive: true });
    c.addEventListener("touchmove", onMove, { passive: true });
    c.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      c.removeEventListener("touchstart", onStart);
      c.removeEventListener("touchmove", onMove);
      c.removeEventListener("touchend", onEnd);
    };
  }, [leftRevealWidth, rightRevealWidth, openThreshold, closeThreshold]);

  return { contentRef, leftActionsRef, rightActionsRef, close, didSwipeRef };
}
