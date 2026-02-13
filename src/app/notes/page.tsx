"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";

/* ── helpers ── */

function formatNoteDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diff = Math.floor(
    (today.getTime() - noteDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff === 0)
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diff === 1) return "昨日";
  if (diff < 7)
    return date.toLocaleDateString("ja-JP", { weekday: "short" });
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getPreview(body: string): string {
  const lines = body
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 2)
    .join(" ");
  return lines || "追加テキストなし";
}

/* ── component ── */

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();

  const [view, setView] = useState<"list" | "edit">("list");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [search, setSearch] = useState("");

  /* edit state — local while editing, synced on save */
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* auto-resize textarea */
  const resizeBody = useCallback(() => {
    const el = bodyRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, []);

  useEffect(() => {
    if (view === "edit") {
      resizeBody();
      if (!editTitle && !editBody) titleRef.current?.focus();
    }
  }, [view, resizeBody, editTitle, editBody]);

  /* edge swipe → go back */
  const goBack = useCallback(() => {
    if (view !== "edit") return;
    if (activeNoteId) {
      const t = editTitle.trim();
      const b = editBody.trim();
      if (!t && !b) {
        deleteNote(activeNoteId);
      } else {
        updateNote(activeNoteId, editTitle, editBody);
      }
    }
    setDirection("back");
    setView("list");
    setActiveNoteId(null);
  }, [view, activeNoteId, editTitle, editBody, deleteNote, updateNote]);

  useEdgeSwipeBack(goBack);

  /* open / create */
  const openNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setEditTitle(note.title);
    setEditBody(note.body);
    setActiveNoteId(id);
    setDirection("forward");
    setView("edit");
  };

  const createNote = () => {
    const id = addNote();
    setEditTitle("");
    setEditBody("");
    setActiveNoteId(id);
    setDirection("forward");
    setView("edit");
  };

  /* delete with swipe */
  const handleDelete = (id: string) => {
    deleteNote(id);
  };

  /* filter */
  const filtered = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const animClass =
    direction === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";

  /* ════════════════════════════════════════
     Edit View
     ════════════════════════════════════════ */
  if (view === "edit") {
    return (
      <div
        className={`flex flex-col min-h-dvh notes-page ${animClass}`}
        key="edit"
      >
        {/* Nav bar — iOS-style */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-1 py-1 notes-nav-bar border-b border-notes-separator backdrop-blur-xl">
          <button
            onClick={goBack}
            className="flex items-center gap-0 text-amber active:opacity-50 min-h-[44px] min-w-[44px] px-2"
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
            onClick={goBack}
            className="text-amber text-[17px] font-medium notes-font min-h-[44px] flex items-center px-4 active:opacity-50"
          >
            完了
          </button>
        </nav>

        {/* Editor */}
        <div className="flex-1 px-4 pt-6 pb-32">
          <input
            ref={titleRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="タイトル"
            className="w-full text-[28px] font-bold notes-text-primary bg-transparent border-none outline-none placeholder:notes-text-quaternary notes-font"
          />
          <textarea
            ref={bodyRef}
            value={editBody}
            onChange={(e) => {
              setEditBody(e.target.value);
              resizeBody();
            }}
            placeholder="メモ"
            className="w-full mt-3 text-[17px] leading-[1.47] notes-text-primary bg-transparent border-none outline-none resize-none placeholder:notes-text-quaternary notes-font min-h-[300px]"
          />
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     List View
     ════════════════════════════════════════ */
  return (
    <div
      className={`flex flex-col min-h-dvh notes-page ${direction === "back" ? animClass : "animate-fade-in"}`}
      key="list"
      ref={scrollRef}
    >
      {/* iOS large-title header */}
      <div className="px-4 pt-14 pb-1">
        <h1 className="text-[34px] font-bold notes-text-primary tracking-tight notes-font">
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
            className="flex-1 bg-transparent text-[17px] notes-text-primary placeholder:notes-text-tertiary outline-none notes-font"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="notes-text-tertiary shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3"
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
        <div className="flex flex-col items-center justify-center py-24 notes-text-tertiary">
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
          {filtered.map((note, index) => (
            <div key={note.id} className="relative">
              {/* Swipe wrapper */}
              <div className="notes-cell-wrapper">
                <NoteCell
                  note={note}
                  onOpen={() => openNote(note.id)}
                  onDelete={() => handleDelete(note.id)}
                />
              </div>
              {/* Inset separator */}
              {index < filtered.length - 1 && (
                <div className="h-px notes-separator-line ml-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center justify-between px-5 py-3">
        <p className="text-[13px] notes-text-tertiary notes-font">
          {notes.length}件のメモ
        </p>
        <button
          onClick={createNote}
          className="flex items-center justify-center w-[44px] h-[44px] text-amber active:opacity-50"
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

/* ══════════════════════════════════════════
   Note Cell — individual list item
   ══════════════════════════════════════════ */

interface NoteCellProps {
  note: { id: string; title: string; body: string; updatedAt: string };
  onOpen: () => void;
  onDelete: () => void;
}

function NoteCell({ note, onOpen, onDelete }: NoteCellProps) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const dirRef = useRef<"h" | "v" | null>(null);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dirRef.current = null;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swiping) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (!dirRef.current) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
          dirRef.current = "v";
          setSwiping(false);
          return;
        }
        if (Math.abs(dx) > 5) dirRef.current = "h";
      }
      if (dirRef.current !== "h") return;

      currentX.current = Math.max(dx, -100);
      setOffset(dx < 0 ? currentX.current : 0);
    },
    [swiping]
  );

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (currentX.current < -70) {
      setOffset(-80);
    } else {
      setOffset(0);
    }
    currentX.current = 0;
  }, []);

  const handleClick = () => {
    if (offset < 0) {
      setOffset(0);
    } else {
      onOpen();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete action behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center">
        <button
          onClick={onDelete}
          className="h-full w-20 flex items-center justify-center bg-red-500 text-white text-[15px] font-medium notes-font"
        >
          削除
        </button>
      </div>

      {/* Cell content */}
      <div
        className={`relative notes-cell-bg ${swiping ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <div className="py-3 px-1 active:notes-cell-active transition-colors duration-75">
          <p className="text-[17px] font-semibold notes-text-primary truncate notes-font leading-snug">
            {note.title || "新規メモ"}
          </p>
          <div className="flex items-baseline gap-2 mt-[2px]">
            <span className="text-[13px] notes-text-secondary font-medium shrink-0 notes-font">
              {formatNoteDate(note.updatedAt)}
            </span>
            <p className="text-[15px] notes-text-tertiary truncate notes-font leading-snug">
              {getPreview(note.body)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
