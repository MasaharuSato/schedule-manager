"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Note,
  NoteFolder,
  loadNotes,
  saveNotes,
  loadNoteFolders,
  saveNoteFolders,
} from "@/lib/storage";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
    setFolders(loadNoteFolders().sort((a, b) => a.order - b.order));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveNotes(notes);
  }, [notes, loaded]);

  useEffect(() => {
    if (loaded) saveNoteFolders(folders);
  }, [folders, loaded]);

  /* ── Refresh from storage (after editor direct-writes) ── */
  const refresh = useCallback(() => {
    setNotes(loadNotes());
    setFolders(loadNoteFolders().sort((a, b) => a.order - b.order));
  }, []);

  /* ── Note CRUD ── */

  const addNote = useCallback((folderId?: string): string => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    setNotes((prev) => [
      { id, title: "", body: "", folderId, createdAt: now, updatedAt: now },
      ...prev,
    ]);
    return id;
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pinNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const moveNote = useCallback((id: string, folderId: string | undefined) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, folderId, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  /* ── Folder CRUD ── */

  const addFolder = useCallback((name: string): string => {
    const id = crypto.randomUUID();
    setFolders((prev) => [
      ...prev,
      { id, name, order: prev.length, createdAt: new Date().toISOString() },
    ]);
    return id;
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // Orphan notes in deleted folder
    setNotes((prev) =>
      prev.map((n) =>
        n.folderId === id ? { ...n, folderId: undefined } : n
      )
    );
  }, []);

  return {
    notes,
    folders,
    loaded,
    refresh,
    addNote,
    deleteNote,
    pinNote,
    moveNote,
    addFolder,
    renameFolder,
    deleteFolder,
  };
}
