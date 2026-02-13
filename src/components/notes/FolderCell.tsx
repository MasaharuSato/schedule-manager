"use client";

import { memo } from "react";
import { useSwipeActions } from "@/hooks/useSwipeActions";
import type { NoteFolder } from "@/lib/storage";

interface FolderCellProps {
  folder: NoteFolder;
  noteCount: number;
  onOpen: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onRename: (folderId: string) => void;
}

export const FolderCell = memo(function FolderCell({
  folder, noteCount, onOpen, onDelete, onRename,
}: FolderCellProps) {
  const { contentRef, rightActionsRef, close, didSwipeRef } =
    useSwipeActions({ rightRevealWidth: 140 });

  const handleClick = () => {
    if (didSwipeRef.current) return;
    onOpen(folder.id);
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-2.5" style={{ background: "var(--notes-surface)" }}>
      {/* Right actions — rename + delete */}
      <div
        ref={rightActionsRef}
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        style={{ visibility: "hidden" }}
      >
        <button
          onClick={() => { onRename(folder.id); close(); }}
          className="w-[70px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
          style={{ background: "#5856D6" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          名変更
        </button>
        <button
          onClick={() => { onDelete(folder.id); close(); }}
          className="w-[70px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
          style={{ background: "#FF3B30" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          削除
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        onClick={handleClick}
        className="relative rounded-xl"
        style={{ transform: "translate3d(0,0,0)", willChange: "transform", background: "var(--notes-surface)" }}
      >
        <div className="py-4 px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-amber)", opacity: 0.9 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-semibold truncate notes-font"
              style={{ color: "var(--notes-primary)" }}>
              {folder.name}
            </p>
            <p className="text-[14px] notes-font mt-0.5"
              style={{ color: "var(--notes-secondary)" }}>
              {noteCount}件
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--notes-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
});
