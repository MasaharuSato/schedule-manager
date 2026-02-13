"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Note, loadNotes, saveNotes } from "@/lib/storage";
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

function createNoteDirect(): string {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  saveNotes([
    { id, title: "", body: "", createdAt: now, updatedAt: now },
    ...loadNotes(),
  ]);
  return id;
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
   Uncontrolled inputs + native event listeners
   Debounced idle save + flush on back/hide
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

  /* Immediate flush — save or delete if empty */
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    cIC(idleHandle.current);
    const t = tv.current.trim();
    const b = bv.current.trim();
    if (!t && !b) deleteNoteDirect(noteId);
    else saveNoteDirect(noteId, tv.current, bv.current);
  }, [noteId]);

  /* Debounced save: 500ms wait → requestIdleCallback */
  const sched = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      idleHandle.current = rIC(() => {
        if (alive.current)
          saveNoteDirect(noteId, tv.current, bv.current);
      });
    }, 500);
  }, [noteId]);

  /* Native event listeners — completely bypass React synthetic events */
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
      /* Auto-resize in rAF — single layout read per frame */
      requestAnimationFrame(() => {
        bEl.style.height = "auto";
        bEl.style.height = bEl.scrollHeight + "px";
      });
    };

    tEl.addEventListener("input", onTitle, { passive: true });
    bEl.addEventListener("input", onBody, { passive: true });

    /* Initial body resize */
    requestAnimationFrame(() => {
      bEl.style.height = "auto";
      bEl.style.height = bEl.scrollHeight + "px";
    });

    /* Focus title if new note */
    if (!initTitle && !initBody) tEl.focus();

    return () => {
      alive.current = false;
      tEl.removeEventListener("input", onTitle);
      bEl.removeEventListener("input", onBody);
    };
  }, [sched, initTitle, initBody]);

  /* Flush on page hide / unload / unmount */
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

  return (
    <div
      className="notes-page notes-push-in"
      style={{ height: "100dvh", display: "flex", flexDirection: "column" }}
    >
      {/* Nav bar */}
      <nav
        className="flex items-center justify-between px-1 py-1 notes-nav-bar backdrop-blur-xl"
        style={{ borderBottom: "0.5px solid var(--notes-separator)" }}
      >
        <button
          onClick={back}
          className="flex items-center gap-0 min-h-[44px] min-w-[44px] px-2 active:opacity-50"
          style={{ color: "var(--color-amber)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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

      {/* Scrollable editor — GPU-isolated layer */}
      <div
        className="notes-scroll flex-1"
        style={{ overflowY: "auto", contain: "layout style" }}
      >
        <div className="px-4 pt-6 pb-40">
          <input
            ref={titleEl}
            type="text"
            defaultValue={initTitle}
            placeholder="タイトル"
            className="w-full text-[28px] font-bold bg-transparent border-none outline-none notes-font"
            style={{
              color: "var(--notes-primary)",
              caretColor: "var(--color-amber)",
            }}
          />
          <textarea
            ref={bodyEl}
            defaultValue={initBody}
            placeholder="メモ"
            className="w-full mt-3 text-[17px] leading-[1.47] bg-transparent border-none outline-none resize-none notes-font"
            style={{
              color: "var(--notes-primary)",
              caretColor: "var(--color-amber)",
              minHeight: "300px",
            }}
          />
        </div>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════
   NoteCell — ref-based swipe, zero re-render
   during gesture. Native touch listeners.
   ══════════════════════════════════════════ */

interface CellProps {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const NoteCell = memo(function NoteCell({
  id,
  title,
  body,
  updatedAt,
  onOpen,
  onDelete,
}: CellProps) {
  const contentEl = useRef<HTMLDivElement>(null);
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
      const base = revealed.current ? -80 : 0;
      off.current = Math.min(0, Math.max(-96, base + dx));
      c.style.transform = `translate3d(${off.current}px,0,0)`;
    };

    const onEnd = () => {
      c.style.transition =
        "transform .28s cubic-bezier(.25,.46,.45,.94)";
      if (off.current < -40) {
        off.current = -80;
        revealed.current = true;
      } else {
        off.current = 0;
        revealed.current = false;
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
      c.style.transition =
        "transform .28s cubic-bezier(.25,.46,.45,.94)";
      c.style.transform = "translate3d(0,0,0)";
      off.current = 0;
      revealed.current = false;
    } else {
      onOpen(id);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete action behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        <button
          onClick={() => onDelete(id)}
          className="h-full w-20 flex items-center justify-center bg-red-500 text-white text-[15px] font-medium notes-font"
        >
          削除
        </button>
      </div>

      {/* Cell content — GPU-promoted layer */}
      <div
        ref={contentEl}
        onClick={handleClick}
        className="notes-cell"
        style={{
          transform: "translate3d(0,0,0)",
          willChange: "transform",
        }}
      >
        <div className="py-3 px-1">
          <p
            className="text-[17px] font-semibold truncate notes-font leading-snug"
            style={{ color: "var(--notes-primary)" }}
          >
            {title || "新規メモ"}
          </p>
          <div className="flex items-baseline gap-2 mt-[2px]">
            <span
              className="text-[13px] font-medium shrink-0 notes-font"
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
   Main — view orchestration + scroll restore
   ══════════════════════════════════════════ */

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<"list" | "edit">("list");
  const [edit, setEdit] = useState({ id: "", title: "", body: "" });
  const [dir, setDir] = useState<"f" | "b">("f");
  const [search, setSearch] = useState("");

  const scrollY = useRef(0);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  /* Read notes from localStorage (single source of truth) */
  const refresh = useCallback(() => {
    const loaded = loadNotes().sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    setNotes(loaded);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Stable callbacks — no re-create on notes change */
  const openNote = useCallback((id: string) => {
    const n = notesRef.current.find((x) => x.id === id);
    if (!n) return;
    scrollY.current = window.scrollY;
    setEdit({ id: n.id, title: n.title, body: n.body });
    setDir("f");
    setView("edit");
  }, []);

  const createNote = useCallback(() => {
    scrollY.current = window.scrollY;
    const id = createNoteDirect();
    setEdit({ id, title: "", body: "" });
    setDir("f");
    setView("edit");
  }, []);

  const handleBack = useCallback(() => {
    setDir("b");
    setView("list");
    refresh();
    requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
  }, [refresh]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteNoteDirect(id);
      refresh();
    },
    [refresh]
  );

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

  /* ── List view ── */
  const filtered = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <div
      className={`flex flex-col min-h-dvh notes-page ${dir === "b" ? "notes-pop-in" : "animate-fade-in"}`}
      style={{ transform: "translateZ(0)" }}
      key="list"
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--notes-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索"
            className="flex-1 bg-transparent text-[17px] outline-none notes-font"
            style={{ color: "var(--notes-primary)" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="var(--notes-tertiary)"
                  fillOpacity="0.3"
                />
                <path
                  d="M15 9l-6 6M9 9l6 6"
                  stroke="var(--notes-bg)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Note cells */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24"
          style={{ color: "var(--notes-tertiary)" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40 mb-3"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-[17px]">
            {search ? "見つかりませんでした" : "メモなし"}
          </p>
        </div>
      ) : (
        <div className="flex-1 px-4 mt-1">
          {filtered.map((n, i) => (
            <div key={n.id}>
              <NoteCell
                id={n.id}
                title={n.title}
                body={n.body}
                updatedAt={n.updatedAt}
                onOpen={openNote}
                onDelete={handleDelete}
              />
              {i < filtered.length - 1 && (
                <div
                  style={{
                    height: "0.5px",
                    background: "var(--notes-separator)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center justify-between px-5 py-3">
        <p
          className="text-[13px] notes-font"
          style={{ color: "var(--notes-tertiary)" }}
        >
          {notes.length}件のメモ
        </p>
        <button
          onClick={createNote}
          className="flex items-center justify-center w-[44px] h-[44px] active:opacity-50"
          style={{ color: "var(--color-amber)" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
