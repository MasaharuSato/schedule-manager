"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Note,
  NoteFolder,
  loadNotes,
  saveNotes,
  loadNoteFolders,
  saveNoteFolders,
} from "@/lib/storage";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";

/* ══════════════════════════════════════════
   Direct storage ops — bypass React state
   ══════════════════════════════════════════ */

function saveNoteDirect(id: string, title: string, body: string) {
  const all = loadNotes();
  const now = new Date().toISOString();
  saveNotes(
    all.map((n) => (n.id === id ? { ...n, title, body, updatedAt: now } : n))
  );
}

function deleteNoteDirect(id: string) {
  saveNotes(loadNotes().filter((n) => n.id !== id));
}

function createNoteDirect(folderId?: string): string {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  saveNotes([
    { id, title: "", body: "", folderId, createdAt: now, updatedAt: now },
    ...loadNotes(),
  ]);
  return id;
}

function pinNoteDirect(id: string, pinned: boolean) {
  const all = loadNotes();
  const now = new Date().toISOString();
  saveNotes(
    all.map((n) =>
      n.id === id ? { ...n, isPinned: pinned, updatedAt: now } : n
    )
  );
}

function moveNoteDirect(id: string, folderId: string | undefined) {
  const all = loadNotes();
  const now = new Date().toISOString();
  saveNotes(
    all.map((n) => (n.id === id ? { ...n, folderId, updatedAt: now } : n))
  );
}

function createFolderDirect(name: string): string {
  const folders = loadNoteFolders();
  const id = crypto.randomUUID();
  const order = folders.length;
  saveNoteFolders([
    ...folders,
    { id, name, order, createdAt: new Date().toISOString() },
  ]);
  return id;
}

function renameFolderDirect(id: string, name: string) {
  saveNoteFolders(
    loadNoteFolders().map((f) => (f.id === id ? { ...f, name } : f))
  );
}

function deleteFolderDirect(id: string) {
  saveNoteFolders(loadNoteFolders().filter((f) => f.id !== id));
  // Move notes in this folder to unfiled
  const notes = loadNotes();
  saveNotes(
    notes.map((n) =>
      n.folderId === id ? { ...n, folderId: undefined } : n
    )
  );
}

/* ── Helpers ── */

function fmtDate(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const td = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((t0.getTime() - td.getTime()) / 86400000);
  if (diff === 0)
    return d.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diff === 1) return "昨日";
  if (diff < 7) return d.toLocaleDateString("ja-JP", { weekday: "short" });
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function preview(body: string): string {
  return (
    body
      .split("\n")
      .filter((l) => l.trim())
      .slice(0, 2)
      .join(" ") || "追加テキストなし"
  );
}

function sortNotes(notes: Note[]): Note[] {
  const pinned = notes
    .filter((n) => n.isPinned)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  const unpinned = notes
    .filter((n) => !n.isPinned)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  return [...pinned, ...unpinned];
}

/* ── Idle scheduler ── */

const rIC =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: () => void) => window.setTimeout(cb, 1);
const cIC =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? window.cancelIdleCallback
    : (id: number) => window.clearTimeout(id);

/* ══════════════════════════════════════════
   NoteEditor — zero re-renders during input
   ══════════════════════════════════════════ */

interface EditorProps {
  noteId: string;
  initTitle: string;
  initBody: string;
  onBack: () => void;
}

const NoteEditor = memo(function NoteEditor({
  noteId,
  initTitle,
  initBody,
  onBack,
}: EditorProps) {
  const titleEl = useRef<HTMLInputElement>(null);
  const bodyEl = useRef<HTMLTextAreaElement>(null);
  const tv = useRef(initTitle);
  const bv = useRef(initBody);
  const timer = useRef(0);
  const idleHandle = useRef(0);
  const alive = useRef(true);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    cIC(idleHandle.current);
    const t = tv.current.trim();
    const b = bv.current.trim();
    if (!t && !b) deleteNoteDirect(noteId);
    else saveNoteDirect(noteId, tv.current, bv.current);
  }, [noteId]);

  const sched = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      idleHandle.current = rIC(() => {
        if (alive.current)
          saveNoteDirect(noteId, tv.current, bv.current);
      });
    }, 500);
  }, [noteId]);

  useEffect(() => {
    const tEl = titleEl.current!;
    const bEl = bodyEl.current!;

    const onTitle = () => {
      tv.current = tEl.value;
      sched();
    };

    const onBody = () => {
      bv.current = bEl.value;
      sched();
      requestAnimationFrame(() => {
        bEl.style.height = "auto";
        bEl.style.height = bEl.scrollHeight + "px";
      });
    };

    tEl.addEventListener("input", onTitle, { passive: true });
    bEl.addEventListener("input", onBody, { passive: true });

    requestAnimationFrame(() => {
      bEl.style.height = "auto";
      bEl.style.height = bEl.scrollHeight + "px";
    });

    if (!initTitle && !initBody) tEl.focus();

    return () => {
      alive.current = false;
      tEl.removeEventListener("input", onTitle);
      bEl.removeEventListener("input", onBody);
    };
  }, [sched, initTitle, initBody]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", flush);
    };
  }, [flush]);

  const back = useCallback(() => {
    flush();
    onBack();
  }, [flush, onBack]);

  useEdgeSwipeBack(back);

  useEffect(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="notes-page notes-push-in"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", touchAction: "pan-y", overscrollBehavior: "none" }}
    >
      <nav
        className="flex items-center justify-between px-1 py-1 notes-nav-bar backdrop-blur-xl"
        style={{ borderBottom: "0.5px solid var(--notes-separator)" }}
      >
        <button
          onClick={back}
          className="flex items-center gap-0 min-h-[44px] min-w-[44px] px-2 active:opacity-50"
          style={{ color: "var(--color-amber)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[17px] notes-font">メモ</span>
        </button>
        <button
          onClick={back}
          className="text-[17px] font-medium notes-font min-h-[44px] flex items-center px-4 active:opacity-50"
          style={{ color: "var(--color-amber)" }}
        >
          完了
        </button>
      </nav>

      <div
        className="notes-scroll flex-1"
        style={{ overflowY: "auto", overflowX: "hidden", contain: "layout style paint", touchAction: "pan-y", overscrollBehaviorX: "none" }}
      >
        <div className="px-4 pt-6 pb-40">
          <input
            ref={titleEl}
            type="text"
            defaultValue={initTitle}
            placeholder="タイトル"
            className="w-full text-[28px] font-bold bg-transparent border-none outline-none notes-font"
            style={{ color: "var(--notes-primary)", caretColor: "var(--color-amber)" }}
          />
          <textarea
            ref={bodyEl}
            defaultValue={initBody}
            placeholder="メモ"
            className="w-full mt-3 text-[17px] leading-[1.47] bg-transparent border-none outline-none resize-none notes-font"
            style={{ color: "var(--notes-primary)", caretColor: "var(--color-amber)", minHeight: "300px", overflowX: "hidden", wordBreak: "break-word", overflowWrap: "anywhere" }}
          />
        </div>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════
   NoteCell — ref-based swipe, larger card
   with clear visual boundaries
   ══════════════════════════════════════════ */

interface CellProps {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  isPinned?: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onMove: (id: string) => void;
}

const NoteCell = memo(function NoteCell({
  id,
  title,
  body,
  updatedAt,
  isPinned,
  onOpen,
  onDelete,
  onPin,
  onMove,
}: CellProps) {
  const contentEl = useRef<HTMLDivElement>(null);
  const actionsEl = useRef<HTMLDivElement>(null);
  const sx = useRef(0);
  const sy = useRef(0);
  const off = useRef(0);
  const dir = useRef<"h" | "v" | null>(null);
  const revealed = useRef(false);
  const didSwipe = useRef(false);

  useEffect(() => {
    const c = contentEl.current!;

    const onStart = (e: TouchEvent) => {
      sx.current = e.touches[0].clientX;
      sy.current = e.touches[0].clientY;
      dir.current = null;
      didSwipe.current = false;
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
        if (Math.abs(dx) > 5) dir.current = "h";
      }
      if (dir.current !== "h") return;

      didSwipe.current = true;
      /* Show action buttons as soon as swipe starts */
      if (actionsEl.current) actionsEl.current.style.visibility = "visible";
      const base = revealed.current ? -180 : 0;
      off.current = Math.min(0, Math.max(-196, base + dx));
      c.style.transform = `translate3d(${off.current}px,0,0)`;
    };

    const onEnd = () => {
      c.style.transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";
      if (revealed.current) {
        /* When open: easy to close — just 40px right movement */
        if (off.current > -140) {
          off.current = 0;
          revealed.current = false;
          /* Hide actions after close animation */
          setTimeout(() => {
            if (actionsEl.current && !revealed.current)
              actionsEl.current.style.visibility = "hidden";
          }, 300);
        } else {
          off.current = -180;
        }
      } else {
        /* When closed: open if past 60px */
        if (off.current < -60) {
          off.current = -180;
          revealed.current = true;
        } else {
          off.current = 0;
          /* Hide actions */
          setTimeout(() => {
            if (actionsEl.current && !revealed.current)
              actionsEl.current.style.visibility = "hidden";
          }, 300);
        }
      }
      c.style.transform = `translate3d(${off.current}px,0,0)`;
    };

    c.addEventListener("touchstart", onStart, { passive: true });
    c.addEventListener("touchmove", onMove, { passive: true });
    c.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      c.removeEventListener("touchstart", onStart);
      c.removeEventListener("touchmove", onMove);
      c.removeEventListener("touchend", onEnd);
    };
  }, []);

  const handleClick = () => {
    if (didSwipe.current) return;
    if (revealed.current) {
      const c = contentEl.current!;
      c.style.transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";
      c.style.transform = "translate3d(0,0,0)";
      off.current = 0;
      revealed.current = false;
      setTimeout(() => {
        if (actionsEl.current) actionsEl.current.style.visibility = "hidden";
      }, 300);
    } else {
      onOpen(id);
    }
  };

  const closeSwipe = () => {
    const c = contentEl.current!;
    c.style.transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";
    c.style.transform = "translate3d(0,0,0)";
    off.current = 0;
    revealed.current = false;
    setTimeout(() => {
      if (actionsEl.current) actionsEl.current.style.visibility = "hidden";
    }, 300);
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-2.5" style={{ background: "var(--notes-surface)" }}>
      {/* Action buttons behind — hidden until swipe starts */}
      <div
        ref={actionsEl}
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        style={{ visibility: "hidden" }}
      >
        <button
          onClick={() => { onPin(id); closeSwipe(); }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
          style={{ background: "#FF9500" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {isPinned ? (
              <path d="M16.5 2.25a.75.75 0 0 1 .75.75v1.19l1.72 1.72a.75.75 0 0 1 .22.53v3.06a.75.75 0 0 1-.22.53L17 12l-1.5 6.75L12 21l-3.5-2.25L7 12l-1.97-1.97a.75.75 0 0 1-.22-.53V6.44a.75.75 0 0 1 .22-.53L6.75 4.19V3a.75.75 0 0 1 .75-.75h9z" />
            ) : (
              <path d="M12 2l2.4 7.2H21l-5.4 3.9 2 7.2L12 16.2 6.4 20.3l2-7.2L3 9.2h6.6z" />
            )}
          </svg>
          {isPinned ? "解除" : "ピン"}
        </button>
        <button
          onClick={() => { onMove(id); closeSwipe(); }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
          style={{ background: "#5856D6" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          移動
        </button>
        <button
          onClick={() => { onDelete(id); closeSwipe(); }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
          style={{ background: "#FF3B30" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          削除
        </button>
      </div>

      {/* Cell content — GPU-promoted layer */}
      <div
        ref={contentEl}
        onClick={handleClick}
        className="relative rounded-xl"
        style={{
          transform: "translate3d(0,0,0)",
          willChange: "transform",
          background: "var(--notes-surface)",
        }}
      >
        <div className="py-4 px-4">
          <div className="flex items-center gap-2">
            {isPinned && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-amber)" stroke="none" className="shrink-0">
                <path d="M12 2l2.4 7.2H21l-5.4 3.9 2 7.2L12 16.2 6.4 20.3l2-7.2L3 9.2h6.6z" />
              </svg>
            )}
            <p
              className="text-[17px] font-semibold truncate notes-font leading-snug flex-1"
              style={{ color: "var(--notes-primary)" }}
            >
              {title || "新規メモ"}
            </p>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className="text-[14px] font-medium shrink-0 notes-font"
              style={{ color: "var(--notes-secondary)" }}
            >
              {fmtDate(updatedAt)}
            </span>
            <p
              className="text-[15px] truncate notes-font leading-snug"
              style={{ color: "var(--notes-tertiary)" }}
            >
              {preview(body)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════
   FolderCell — folder item in list
   ══════════════════════════════════════════ */

interface FolderCellProps {
  folder: NoteFolder;
  noteCount: number;
  onOpen: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onRename: (folderId: string) => void;
}

const FolderCell = memo(function FolderCell({
  folder,
  noteCount,
  onOpen,
  onDelete,
  onRename,
}: FolderCellProps) {
  const contentEl = useRef<HTMLDivElement>(null);
  const actionsEl = useRef<HTMLDivElement>(null);
  const sx = useRef(0);
  const sy = useRef(0);
  const off = useRef(0);
  const dirRef = useRef<"h" | "v" | null>(null);
  const revealed = useRef(false);
  const didSwipe = useRef(false);

  useEffect(() => {
    const c = contentEl.current!;

    const onStart = (e: TouchEvent) => {
      sx.current = e.touches[0].clientX;
      sy.current = e.touches[0].clientY;
      dirRef.current = null;
      didSwipe.current = false;
      c.style.transition = "none";
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - sx.current;
      const dy = e.touches[0].clientY - sy.current;
      if (!dirRef.current) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) { dirRef.current = "v"; return; }
        if (Math.abs(dx) > 5) dirRef.current = "h";
      }
      if (dirRef.current !== "h") return;
      didSwipe.current = true;
      if (actionsEl.current) actionsEl.current.style.visibility = "visible";
      const base = revealed.current ? -120 : 0;
      off.current = Math.min(0, Math.max(-136, base + dx));
      c.style.transform = `translate3d(${off.current}px,0,0)`;
    };

    const onEnd = () => {
      c.style.transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";
      if (revealed.current) {
        if (off.current > -80) {
          off.current = 0;
          revealed.current = false;
          setTimeout(() => {
            if (actionsEl.current && !revealed.current)
              actionsEl.current.style.visibility = "hidden";
          }, 300);
        } else {
          off.current = -120;
        }
      } else {
        if (off.current < -50) {
          off.current = -120;
          revealed.current = true;
        } else {
          off.current = 0;
          setTimeout(() => {
            if (actionsEl.current && !revealed.current)
              actionsEl.current.style.visibility = "hidden";
          }, 300);
        }
      }
      c.style.transform = `translate3d(${off.current}px,0,0)`;
    };

    c.addEventListener("touchstart", onStart, { passive: true });
    c.addEventListener("touchmove", onMove, { passive: true });
    c.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      c.removeEventListener("touchstart", onStart);
      c.removeEventListener("touchmove", onMove);
      c.removeEventListener("touchend", onEnd);
    };
  }, []);

  const handleClick = () => {
    if (didSwipe.current) return;
    if (revealed.current) {
      const c = contentEl.current!;
      c.style.transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";
      c.style.transform = "translate3d(0,0,0)";
      off.current = 0;
      revealed.current = false;
      setTimeout(() => {
        if (actionsEl.current) actionsEl.current.style.visibility = "hidden";
      }, 300);
    } else {
      onOpen(folder.id);
    }
  };

  const closeSwipe = () => {
    const c = contentEl.current!;
    c.style.transition = "transform .28s cubic-bezier(.25,.46,.45,.94)";
    c.style.transform = "translate3d(0,0,0)";
    off.current = 0;
    revealed.current = false;
    setTimeout(() => {
      if (actionsEl.current) actionsEl.current.style.visibility = "hidden";
    }, 300);
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-2.5" style={{ background: "var(--notes-surface)" }}>
      {/* Actions — hidden until swipe starts */}
      <div
        ref={actionsEl}
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        style={{ visibility: "hidden" }}
      >
        <button
          onClick={() => { onRename(folder.id); closeSwipe(); }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
          style={{ background: "#5856D6" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          名変更
        </button>
        <button
          onClick={() => { onDelete(folder.id); closeSwipe(); }}
          className="w-[60px] flex flex-col items-center justify-center gap-1 text-white text-[11px] font-medium notes-font"
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
        ref={contentEl}
        onClick={handleClick}
        className="relative rounded-xl"
        style={{ transform: "translate3d(0,0,0)", willChange: "transform", background: "var(--notes-surface)" }}
      >
        <div className="py-4 px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--color-amber)", opacity: 0.9 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-semibold truncate notes-font" style={{ color: "var(--notes-primary)" }}>
              {folder.name}
            </p>
            <p className="text-[14px] notes-font mt-0.5" style={{ color: "var(--notes-secondary)" }}>
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

/* ══════════════════════════════════════════
   MoveSheet — select folder to move note to
   ══════════════════════════════════════════ */

interface MoveSheetProps {
  noteId: string;
  currentFolderId?: string;
  folders: NoteFolder[];
  onMove: (noteId: string, folderId: string | undefined) => void;
  onClose: () => void;
}

function MoveSheet({ noteId, currentFolderId, folders, onMove, onClose }: MoveSheetProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div
        className="relative w-full max-w-md rounded-t-2xl animate-sheet-up notes-page"
        style={{ background: "var(--notes-surface)", maxHeight: "60vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid var(--notes-separator)" }}>
          <h2 className="text-[20px] font-bold notes-font" style={{ color: "var(--notes-primary)" }}>
            フォルダを選択
          </h2>
          <button onClick={onClose} className="text-[17px] notes-font min-h-[44px] flex items-center px-2 active:opacity-50" style={{ color: "var(--color-amber)" }}>
            キャンセル
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(60vh - 64px)" }}>
          {/* Unfiled option */}
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-amber)", opacity: 0.9 }}>
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

/* ══════════════════════════════════════════
   Main — view orchestration
   ══════════════════════════════════════════ */

type ViewMode = "root" | "folder" | "edit";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [view, setView] = useState<ViewMode>("root");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ id: "", title: "", body: "" });
  const [dir, setDir] = useState<"f" | "b">("f");
  const [search, setSearch] = useState("");
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  const scrollY = useRef(0);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  const refresh = useCallback(() => {
    setNotes(loadNotes());
    setFolders(loadNoteFolders().sort((a, b) => a.order - b.order));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* ── Actions ── */

  const openNote = useCallback((id: string) => {
    const n = notesRef.current.find((x) => x.id === id);
    if (!n) return;
    scrollY.current = window.scrollY;
    setEdit({ id: n.id, title: n.title, body: n.body });
    setDir("f");
    setView("edit");
  }, []);

  const createNote = useCallback((folderId?: string) => {
    scrollY.current = window.scrollY;
    const id = createNoteDirect(folderId);
    setEdit({ id, title: "", body: "" });
    setDir("f");
    setView("edit");
  }, []);

  const handleBack = useCallback(() => {
    setDir("b");
    if (view === "edit" && activeFolderId) {
      setView("folder");
    } else if (view === "edit") {
      setView("root");
    } else {
      setView("root");
      setActiveFolderId(null);
    }
    refresh();
    requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
  }, [refresh, view, activeFolderId]);

  const handleDelete = useCallback((id: string) => {
    deleteNoteDirect(id);
    refresh();
  }, [refresh]);

  const handlePin = useCallback((id: string) => {
    const n = notesRef.current.find((x) => x.id === id);
    if (!n) return;
    pinNoteDirect(id, !n.isPinned);
    refresh();
  }, [refresh]);

  const handleMoveNote = useCallback((noteId: string, folderId: string | undefined) => {
    moveNoteDirect(noteId, folderId);
    refresh();
  }, [refresh]);

  const openFolder = useCallback((folderId: string) => {
    scrollY.current = window.scrollY;
    setActiveFolderId(folderId);
    setDir("f");
    setView("folder");
  }, []);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    createFolderDirect(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
    refresh();
  }, [newFolderName, refresh]);

  const handleRenameFolder = useCallback(() => {
    if (!renameTarget || !renameName.trim()) return;
    renameFolderDirect(renameTarget, renameName.trim());
    setRenameTarget(null);
    setRenameName("");
    refresh();
  }, [renameTarget, renameName, refresh]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    deleteFolderDirect(folderId);
    refresh();
  }, [refresh]);

  const startRename = useCallback((folderId: string) => {
    const f = folders.find((x) => x.id === folderId);
    if (!f) return;
    setRenameTarget(folderId);
    setRenameName(f.name);
  }, [folders]);

  /* Edge swipe: folder → root, root/edit → just block browser back */
  const edgeSwipeCb = useCallback(() => {
    if (view === "folder") {
      setDir("b");
      setView("root");
      setActiveFolderId(null);
      refresh();
    }
  }, [view, refresh]);

  useEdgeSwipeBack(view === "folder" ? edgeSwipeCb : null);

  /* ── Edit view ── */
  if (view === "edit") {
    return (
      <NoteEditor
        key={edit.id}
        noteId={edit.id}
        initTitle={edit.title}
        initBody={edit.body}
        onBack={handleBack}
      />
    );
  }

  /* ── Folder view (notes inside a folder) ── */
  if (view === "folder" && activeFolderId) {
    const folder = folders.find((f) => f.id === activeFolderId);
    const folderNotes = sortNotes(
      notes.filter((n) => n.folderId === activeFolderId)
    );
    const filtered = search
      ? folderNotes.filter(
          (n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.body.toLowerCase().includes(search.toLowerCase())
        )
      : folderNotes;

    return (
      <div
        className={`flex flex-col min-h-dvh notes-page ${dir === "b" ? "notes-pop-in" : "notes-push-in"}`}
        style={{ transform: "translateZ(0)", overflowX: "hidden", touchAction: "pan-y" }}
        key="folder"
      >
        {/* Nav */}
        <nav
          className="flex items-center justify-between px-1 py-1 notes-nav-bar backdrop-blur-xl"
          style={{ borderBottom: "0.5px solid var(--notes-separator)" }}
        >
          <button
            onClick={() => { setDir("b"); setView("root"); setActiveFolderId(null); refresh(); }}
            className="flex items-center gap-0 min-h-[44px] min-w-[44px] px-2 active:opacity-50"
            style={{ color: "var(--color-amber)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-[17px] notes-font">メモ</span>
          </button>
        </nav>

        {/* Folder title */}
        <div className="px-4 pt-6 pb-1">
          <h1
            className="text-[34px] font-bold tracking-tight notes-font"
            style={{ color: "var(--notes-primary)" }}
          >
            {folder?.name || "フォルダ"}
          </h1>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 rounded-[10px] notes-search-bg px-3 py-[9px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--notes-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="検索"
              className="flex-1 bg-transparent text-[17px] outline-none notes-font"
              style={{ color: "var(--notes-primary)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="var(--notes-tertiary)" fillOpacity="0.3" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="var(--notes-bg)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Notes list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--notes-tertiary)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 mb-3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-[17px]">{search ? "見つかりませんでした" : "メモなし"}</p>
          </div>
        ) : (
          <div className="flex-1 px-4 mt-1">
            {/* Pinned section */}
            {filtered.some((n) => n.isPinned) && (
              <>
                <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-2" style={{ color: "var(--notes-secondary)" }}>
                  ピン固定
                </p>
                {filtered.filter((n) => n.isPinned).map((n) => (
                  <NoteCell key={n.id} id={n.id} title={n.title} body={n.body} updatedAt={n.updatedAt} isPinned={n.isPinned} onOpen={openNote} onDelete={handleDelete} onPin={handlePin} onMove={(id) => setMoveTarget(id)} />
                ))}
              </>
            )}
            {/* Other notes */}
            {filtered.some((n) => !n.isPinned) && (
              <>
                {filtered.some((n) => n.isPinned) && (
                  <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-4" style={{ color: "var(--notes-secondary)" }}>
                    メモ
                  </p>
                )}
                {filtered.filter((n) => !n.isPinned).map((n) => (
                  <NoteCell key={n.id} id={n.id} title={n.title} body={n.body} updatedAt={n.updatedAt} isPinned={n.isPinned} onOpen={openNote} onDelete={handleDelete} onPin={handlePin} onMove={(id) => setMoveTarget(id)} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center justify-between px-5 py-3">
          <p className="text-[13px] notes-font" style={{ color: "var(--notes-tertiary)" }}>
            {folderNotes.length}件のメモ
          </p>
          <button
            onClick={() => createNote(activeFolderId || undefined)}
            className="flex items-center justify-center w-[44px] h-[44px] active:opacity-50"
            style={{ color: "var(--color-amber)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Move sheet */}
        {moveTarget && (
          <MoveSheet
            noteId={moveTarget}
            currentFolderId={notes.find((n) => n.id === moveTarget)?.folderId}
            folders={folders}
            onMove={handleMoveNote}
            onClose={() => setMoveTarget(null)}
          />
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     Root view — folders + all/unfiled notes
     ══════════════════════════════════════════ */

  const allNotesSorted = sortNotes(notes);
  const unfiledNotes = sortNotes(notes.filter((n) => !n.folderId));

  const filtered = search
    ? allNotesSorted.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div
      className={`flex flex-col min-h-dvh notes-page ${dir === "b" ? "notes-pop-in" : "animate-fade-in"}`}
      style={{ transform: "translateZ(0)", overflowX: "hidden", touchAction: "pan-y" }}
      key="root"
    >
      {/* iOS large-title header */}
      <div className="px-4 pt-14 pb-1">
        <h1
          className="text-[34px] font-bold tracking-tight notes-font"
          style={{ color: "var(--notes-primary)" }}
        >
          メモ
        </h1>
      </div>

      {/* Search bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-[10px] notes-search-bg px-3 py-[9px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--notes-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="検索"
            className="flex-1 bg-transparent text-[17px] outline-none notes-font"
            style={{ color: "var(--notes-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="var(--notes-tertiary)" fillOpacity="0.3" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="var(--notes-bg)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Search results ── */}
      {filtered ? (
        <div className="flex-1 px-4 mt-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--notes-tertiary)" }}>
              <p className="text-[17px]">見つかりませんでした</p>
            </div>
          ) : (
            filtered.map((n) => (
              <NoteCell key={n.id} id={n.id} title={n.title} body={n.body} updatedAt={n.updatedAt} isPinned={n.isPinned} onOpen={openNote} onDelete={handleDelete} onPin={handlePin} onMove={(id) => setMoveTarget(id)} />
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 px-4 mt-1">
          {/* Folders section */}
          {folders.length > 0 && (
            <>
              <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-2" style={{ color: "var(--notes-secondary)" }}>
                フォルダ
              </p>
              {folders.map((f) => (
                <FolderCell
                  key={f.id}
                  folder={f}
                  noteCount={notes.filter((n) => n.folderId === f.id).length}
                  onOpen={openFolder}
                  onDelete={handleDeleteFolder}
                  onRename={startRename}
                />
              ))}
            </>
          )}

          {/* Pinned notes (unfiled) */}
          {unfiledNotes.some((n) => n.isPinned) && (
            <>
              <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-4" style={{ color: "var(--notes-secondary)" }}>
                ピン固定
              </p>
              {unfiledNotes.filter((n) => n.isPinned).map((n) => (
                <NoteCell key={n.id} id={n.id} title={n.title} body={n.body} updatedAt={n.updatedAt} isPinned={n.isPinned} onOpen={openNote} onDelete={handleDelete} onPin={handlePin} onMove={(id) => setMoveTarget(id)} />
              ))}
            </>
          )}

          {/* Unfiled notes */}
          {unfiledNotes.some((n) => !n.isPinned) && (
            <>
              <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-4" style={{ color: "var(--notes-secondary)" }}>
                {folders.length > 0 ? "未分類" : "メモ"}
              </p>
              {unfiledNotes.filter((n) => !n.isPinned).map((n) => (
                <NoteCell key={n.id} id={n.id} title={n.title} body={n.body} updatedAt={n.updatedAt} isPinned={n.isPinned} onOpen={openNote} onDelete={handleDelete} onPin={handlePin} onMove={(id) => setMoveTarget(id)} />
              ))}
            </>
          )}

          {/* Empty state */}
          {notes.length === 0 && folders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--notes-tertiary)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 mb-3">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p className="text-[17px]">メモなし</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] active:opacity-50"
            style={{ color: "var(--color-amber)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </button>
          <p className="text-[13px] notes-font" style={{ color: "var(--notes-tertiary)" }}>
            {notes.length}件のメモ
          </p>
        </div>
        <button
          onClick={() => createNote()}
          className="flex items-center justify-center w-[44px] h-[44px] active:opacity-50"
          style={{ color: "var(--color-amber)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Move sheet */}
      {moveTarget && (
        <MoveSheet
          noteId={moveTarget}
          currentFolderId={notes.find((n) => n.id === moveTarget)?.folderId}
          folders={folders}
          onMove={handleMoveNote}
          onClose={() => setMoveTarget(null)}
        />
      )}

      {/* New folder dialog */}
      {showNewFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowNewFolder(false)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div
            className="relative w-[280px] rounded-2xl p-6 animate-fade-in"
            style={{ background: "var(--notes-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-bold text-center notes-font mb-4" style={{ color: "var(--notes-primary)" }}>
              新規フォルダ
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="フォルダ名"
              autoFocus
              className="w-full text-[17px] bg-transparent rounded-lg px-3 py-2.5 outline-none notes-font"
              style={{
                color: "var(--notes-primary)",
                border: "1px solid var(--notes-separator)",
                caretColor: "var(--color-amber)",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNewFolder(false)}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-medium notes-font active:opacity-50"
                style={{ color: "var(--color-amber)", background: "rgba(255,255,255,0.05)" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-bold notes-font active:opacity-50"
                style={{ color: "#fff", background: "var(--color-amber)" }}
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename folder dialog */}
      {renameTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setRenameTarget(null)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div
            className="relative w-[280px] rounded-2xl p-6 animate-fade-in"
            style={{ background: "var(--notes-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-bold text-center notes-font mb-4" style={{ color: "var(--notes-primary)" }}>
              フォルダ名を変更
            </h3>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="フォルダ名"
              autoFocus
              className="w-full text-[17px] bg-transparent rounded-lg px-3 py-2.5 outline-none notes-font"
              style={{
                color: "var(--notes-primary)",
                border: "1px solid var(--notes-separator)",
                caretColor: "var(--color-amber)",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); }}
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setRenameTarget(null)}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-medium notes-font active:opacity-50"
                style={{ color: "var(--color-amber)", background: "rgba(255,255,255,0.05)" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleRenameFolder}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-bold notes-font active:opacity-50"
                style={{ color: "#fff", background: "var(--color-amber)" }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
