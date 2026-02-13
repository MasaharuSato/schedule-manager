"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { loadNotes, saveNotes, type Note } from "@/lib/storage";
import { useNotes } from "@/hooks/useNotes";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";
import { NoteCell } from "@/components/notes/NoteCell";
import { FolderCell } from "@/components/notes/FolderCell";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { MoveNoteSheet } from "@/components/notes/MoveNoteSheet";

/* ── Direct storage for creating notes (bypass React state) ── */

function createNoteDirect(folderId?: string): string {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  saveNotes([
    { id, title: "", body: "", folderId, createdAt: now, updatedAt: now },
    ...loadNotes(),
  ]);
  return id;
}

/* ── Date grouping ── */

function getDateGroup(updatedAt: string): string {
  const d = new Date(updatedAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - noteDay.getTime()) / 86400000);
  if (diff === 0) return "今日";
  if (diff === 1) return "昨日";
  if (diff < 7) return "過去7日間";
  if (diff < 30) return "過去30日間";
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function groupByDate(notes: Note[]): { label: string; notes: Note[] }[] {
  const sorted = sortNotes(notes);
  const groups: { label: string; notes: Note[] }[] = [];
  for (const n of sorted) {
    const label = getDateGroup(n.updatedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.notes.push(n);
    } else {
      groups.push({ label, notes: [n] });
    }
  }
  return groups;
}

/* ── Search bar ── */

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 rounded-[10px] notes-search-bg px-3 py-[9px]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--notes-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="検索"
          className="flex-1 bg-transparent text-[17px] outline-none notes-font"
          style={{ color: "var(--notes-primary)" }} />
        {value && (
          <button onClick={() => onChange("")} className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-3">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="var(--notes-tertiary)" fillOpacity="0.3" />
              <path d="M15 9l-6 6M9 9l6 6" stroke="var(--notes-bg)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Note list with date groups ── */

function NoteListGrouped({
  notes, onOpen, onDelete, onPin, onMove,
}: {
  notes: Note[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onMove: (id: string) => void;
}) {
  const pinned = sortNotes(notes.filter((n) => n.isPinned));
  const unpinned = notes.filter((n) => !n.isPinned);
  const groups = groupByDate(unpinned);

  return (
    <>
      {pinned.length > 0 && (
        <>
          <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-2"
            style={{ color: "var(--notes-secondary)" }}>ピン固定</p>
          {pinned.map((n) => (
            <NoteCell key={n.id} id={n.id} title={n.title} body={n.body}
              updatedAt={n.updatedAt} isPinned={n.isPinned}
              onOpen={onOpen} onDelete={onDelete} onPin={onPin} onMove={onMove} />
          ))}
        </>
      )}
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-4"
            style={{ color: "var(--notes-secondary)" }}>{g.label}</p>
          {g.notes.map((n) => (
            <NoteCell key={n.id} id={n.id} title={n.title} body={n.body}
              updatedAt={n.updatedAt} isPinned={n.isPinned}
              onOpen={onOpen} onDelete={onDelete} onPin={onPin} onMove={onMove} />
          ))}
        </div>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════
   Main — view orchestration
   ══════════════════════════════════════════ */

type ViewMode = "root" | "folder" | "edit";

export default function NotesPage() {
  const {
    notes, folders, loaded, refresh,
    deleteNote, pinNote, moveNote,
    addFolder, renameFolder, deleteFolder,
  } = useNotes();

  const [view, setView] = useState<ViewMode>("root");
  const [dir, setDir] = useState<"f" | "b">("f");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ id: "", title: "", body: "" });
  const [search, setSearch] = useState("");
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  const scrollY = useRef(0);
  const notesRef = useRef(notes);
  notesRef.current = notes;

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

  const handleDelete = useCallback((id: string) => { deleteNote(id); }, [deleteNote]);
  const handlePin = useCallback((id: string) => { pinNote(id); }, [pinNote]);
  const handleMoveNote = useCallback((noteId: string, folderId: string | undefined) => {
    moveNote(noteId, folderId);
  }, [moveNote]);

  const openFolder = useCallback((folderId: string) => {
    scrollY.current = window.scrollY;
    setActiveFolderId(folderId);
    setDir("f");
    setView("folder");
  }, []);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  }, [newFolderName, addFolder]);

  const handleRenameFolder = useCallback(() => {
    if (!renameTarget || !renameName.trim()) return;
    renameFolder(renameTarget, renameName.trim());
    setRenameTarget(null);
    setRenameName("");
  }, [renameTarget, renameName, renameFolder]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    deleteFolder(folderId);
  }, [deleteFolder]);

  const startRename = useCallback((folderId: string) => {
    const f = folders.find((x) => x.id === folderId);
    if (!f) return;
    setRenameTarget(folderId);
    setRenameName(f.name);
  }, [folders]);

  /* ── Edge swipe back ── */
  const edgeSwipeCb = useCallback(() => {
    if (view === "folder") {
      setDir("b");
      setView("root");
      setActiveFolderId(null);
      refresh();
    }
  }, [view, refresh]);

  useEdgeSwipeBack(view === "folder" ? edgeSwipeCb : null);

  /* ── Loading ── */
  if (!loaded) return null;

  /* ── Edit view ── */
  if (view === "edit") {
    return (
      <NoteEditor key={edit.id} noteId={edit.id}
        initTitle={edit.title} initBody={edit.body} onBack={handleBack} />
    );
  }

  /* ── Folder view ── */
  if (view === "folder" && activeFolderId) {
    const folder = folders.find((f) => f.id === activeFolderId);
    const folderNotes = notes.filter((n) => n.folderId === activeFolderId);
    const filtered = search
      ? folderNotes.filter((n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.body.toLowerCase().includes(search.toLowerCase()))
      : folderNotes;

    return (
      <div className={`flex flex-col min-h-dvh notes-page ${dir === "b" ? "notes-pop-in" : "notes-push-in"}`}
        style={{ transform: "translateZ(0)", overflowX: "hidden", touchAction: "pan-y" }} key="folder">
        <nav className="flex items-center justify-between px-1 py-1 notes-nav-bar backdrop-blur-xl"
          style={{ borderBottom: "0.5px solid var(--notes-separator)" }}>
          <button
            onClick={() => { setDir("b"); setView("root"); setActiveFolderId(null); refresh(); }}
            className="flex items-center gap-0 min-h-[44px] min-w-[44px] px-2 active:opacity-50"
            style={{ color: "var(--color-amber)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-[17px] notes-font">メモ</span>
          </button>
        </nav>

        <div className="px-4 pt-6 pb-1">
          <h1 className="text-[34px] font-bold tracking-tight notes-font"
            style={{ color: "var(--notes-primary)" }}>
            {folder?.name || "フォルダ"}
          </h1>
        </div>

        <SearchBar value={search} onChange={setSearch} />

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
            {search ? (
              filtered.map((n) => (
                <NoteCell key={n.id} id={n.id} title={n.title} body={n.body}
                  updatedAt={n.updatedAt} isPinned={n.isPinned}
                  onOpen={openNote} onDelete={handleDelete} onPin={handlePin}
                  onMove={(id) => setMoveTarget(id)} />
              ))
            ) : (
              <NoteListGrouped notes={filtered}
                onOpen={openNote} onDelete={handleDelete} onPin={handlePin}
                onMove={(id) => setMoveTarget(id)} />
            )}
          </div>
        )}

        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center justify-between px-5 py-3">
          <p className="text-[13px] notes-font" style={{ color: "var(--notes-tertiary)" }}>
            {folderNotes.length}件のメモ
          </p>
          <button onClick={() => createNote(activeFolderId || undefined)}
            className="flex items-center justify-center w-[44px] h-[44px] active:opacity-50"
            style={{ color: "var(--color-amber)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {moveTarget && (
          <MoveNoteSheet noteId={moveTarget}
            currentFolderId={notes.find((n) => n.id === moveTarget)?.folderId}
            folders={folders} onMove={handleMoveNote}
            onClose={() => setMoveTarget(null)} />
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     Root view
     ══════════════════════════════════════════ */

  const unfiledNotes = notes.filter((n) => !n.folderId);
  const allNotesSorted = sortNotes(notes);

  const searchResults = search
    ? allNotesSorted.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className={`flex flex-col min-h-dvh notes-page ${dir === "b" ? "notes-pop-in" : "animate-fade-in"}`}
      style={{ transform: "translateZ(0)", overflowX: "hidden", touchAction: "pan-y" }} key="root">
      <div className="px-4 pt-14 pb-1">
        <h1 className="text-[34px] font-bold tracking-tight notes-font"
          style={{ color: "var(--notes-primary)" }}>メモ</h1>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {searchResults ? (
        <div className="flex-1 px-4 mt-1">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--notes-tertiary)" }}>
              <p className="text-[17px]">見つかりませんでした</p>
            </div>
          ) : (
            searchResults.map((n) => (
              <NoteCell key={n.id} id={n.id} title={n.title} body={n.body}
                updatedAt={n.updatedAt} isPinned={n.isPinned}
                onOpen={openNote} onDelete={handleDelete} onPin={handlePin}
                onMove={(id) => setMoveTarget(id)} />
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 px-4 mt-1">
          {/* Folders */}
          {folders.length > 0 && (
            <>
              <p className="text-[13px] font-semibold notes-font px-1 mb-2 mt-2"
                style={{ color: "var(--notes-secondary)" }}>フォルダ</p>
              {folders.map((f) => (
                <FolderCell key={f.id} folder={f}
                  noteCount={notes.filter((n) => n.folderId === f.id).length}
                  onOpen={openFolder} onDelete={handleDeleteFolder}
                  onRename={startRename} />
              ))}
            </>
          )}

          {/* Unfiled notes with date groups */}
          {unfiledNotes.length > 0 && (
            <div className="mt-2">
              {folders.length > 0 && (
                <p className="text-[13px] font-semibold notes-font px-1 mb-2"
                  style={{ color: "var(--notes-secondary)" }}>未分類</p>
              )}
              <NoteListGrouped notes={unfiledNotes}
                onOpen={openNote} onDelete={handleDelete} onPin={handlePin}
                onMove={(id) => setMoveTarget(id)} />
            </div>
          )}

          {/* Empty */}
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
          <button onClick={() => setShowNewFolder(true)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] active:opacity-50"
            style={{ color: "var(--color-amber)" }}>
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
        <button onClick={() => createNote()}
          className="flex items-center justify-center w-[44px] h-[44px] active:opacity-50"
          style={{ color: "var(--color-amber)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Move sheet */}
      {moveTarget && (
        <MoveNoteSheet noteId={moveTarget}
          currentFolderId={notes.find((n) => n.id === moveTarget)?.folderId}
          folders={folders} onMove={handleMoveNote}
          onClose={() => setMoveTarget(null)} />
      )}

      {/* New folder dialog */}
      {showNewFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowNewFolder(false)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div className="relative w-[280px] rounded-2xl p-6 animate-fade-in"
            style={{ background: "var(--notes-surface)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-center notes-font mb-4"
              style={{ color: "var(--notes-primary)" }}>新規フォルダ</h3>
            <input type="text" value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="フォルダ名" autoFocus
              className="w-full text-[17px] bg-transparent rounded-lg px-3 py-2.5 outline-none notes-font"
              style={{ color: "var(--notes-primary)", border: "1px solid var(--notes-separator)", caretColor: "var(--color-amber)" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNewFolder(false)}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-medium notes-font active:opacity-50"
                style={{ color: "var(--color-amber)", background: "rgba(255,255,255,0.05)" }}>
                キャンセル
              </button>
              <button onClick={handleCreateFolder}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-bold notes-font active:opacity-50"
                style={{ color: "#fff", background: "var(--color-amber)" }}>
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
          <div className="relative w-[280px] rounded-2xl p-6 animate-fade-in"
            style={{ background: "var(--notes-surface)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-center notes-font mb-4"
              style={{ color: "var(--notes-primary)" }}>フォルダ名を変更</h3>
            <input type="text" value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="フォルダ名" autoFocus
              className="w-full text-[17px] bg-transparent rounded-lg px-3 py-2.5 outline-none notes-font"
              style={{ color: "var(--notes-primary)", border: "1px solid var(--notes-separator)", caretColor: "var(--color-amber)" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); }} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRenameTarget(null)}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-medium notes-font active:opacity-50"
                style={{ color: "var(--color-amber)", background: "rgba(255,255,255,0.05)" }}>
                キャンセル
              </button>
              <button onClick={handleRenameFolder}
                className="flex-1 py-2.5 rounded-lg text-[17px] font-bold notes-font active:opacity-50"
                style={{ color: "#fff", background: "var(--color-amber)" }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
