"use client";

import { useState, useCallback } from "react";
import { Note, loadNotes, saveNotes } from "@/lib/storage";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  const persist = useCallback((updated: Note[]) => {
    setNotes(updated);
    saveNotes(updated);
  }, []);

  const addNote = useCallback((): string => {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      createdAt: now,
      updatedAt: now,
    };
    const updated = [note, ...notes];
    persist(updated);
    return note.id;
  }, [notes, persist]);

  const updateNote = useCallback(
    (id: string, title: string, body: string) => {
      const updated = notes.map((n) =>
        n.id === id
          ? { ...n, title, body, updatedAt: new Date().toISOString() }
          : n
      );
      persist(updated);
    },
    [notes, persist]
  );

  const deleteNote = useCallback(
    (id: string) => {
      persist(notes.filter((n) => n.id !== id));
    },
    [notes, persist]
  );

  const sortedNotes = [...notes].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { notes: sortedNotes, addNote, updateNote, deleteNote };
}
