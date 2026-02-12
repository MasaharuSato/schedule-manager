"use client";

import { useRef, useCallback, useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    currentY.current = dy;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragging.current = false;
    if (currentY.current > 100) {
      onClose();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    currentY.current = 0;
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface-elevated animate-sheet-up"
        style={{ maxHeight: "92vh" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-text-secondary/30" />
        </div>

        {title && (
          <div className="px-6 pb-4 pt-2">
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          </div>
        )}

        <div className="overflow-y-auto px-6 pb-14 nav-safe-bottom" style={{ maxHeight: "calc(92vh - 5rem)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
