"use client";

import type { NoteFolder } from "@/lib/storage";

interface MoveNoteSheetProps {
  noteId: string;
  currentFolderId?: string;
  folders: NoteFolder[];
  onMove: (noteId: string, folderId: string | undefined) => void;
  onClose: () => void;
}

export function MoveNoteSheet({ noteId, currentFolderId, folders, onMove, onClose }: MoveNoteSheetProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div
        className="relative w-full max-w-md rounded-t-2xl animate-sheet-up notes-page"
        style={{ background: "var(--notes-surface)", maxHeight: "60vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "0.5px solid var(--notes-separator)" }}>
          <h2 className="text-[20px] font-bold notes-font" style={{ color: "var(--notes-primary)" }}>
            フォルダを選択
          </h2>
          <button onClick={onClose}
            className="text-[17px] notes-font min-h-[44px] flex items-center px-2 active:opacity-50"
            style={{ color: "var(--color-amber)" }}>
            キャンセル
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(60vh - 64px)" }}>
          {/* Unfiled */}
          <button
            onClick={() => { onMove(noteId, undefined); onClose(); }}
            className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl mb-2 text-left"
            style={{
              background: "rgba(255,255,255,0.05)",
              outline: !currentFolderId ? "2px solid var(--color-amber)" : "none",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--notes-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-[17px] notes-font" style={{ color: "var(--notes-primary)" }}>未分類</span>
            {!currentFolderId && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => { onMove(noteId, f.id); onClose(); }}
              className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl mb-2 text-left"
              style={{
                background: "rgba(255,255,255,0.05)",
                outline: currentFolderId === f.id ? "2px solid var(--color-amber)" : "none",
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--color-amber)", opacity: 0.9 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="text-[17px] notes-font" style={{ color: "var(--notes-primary)" }}>{f.name}</span>
              {currentFolderId === f.id && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
