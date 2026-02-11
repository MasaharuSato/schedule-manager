"use client";

import { useState } from "react";

interface TaskFormProps {
  onAdd: (title: string, category?: string) => void;
}

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [showCategory, setShowCategory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, category.trim() || undefined);
    setTitle("");
    setCategory("");
    setShowCategory(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新しいタスクを追加..."
          className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary placeholder:text-text-secondary focus:border-amber focus:outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-xl bg-amber px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-amber-dark disabled:opacity-40"
        >
          追加
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCategory(!showCategory)}
          className="text-sm text-text-secondary hover:text-amber"
        >
          {showCategory ? "− カテゴリを閉じる" : "+ カテゴリ"}
        </button>
        {showCategory && (
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="カテゴリ名"
            className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-amber focus:outline-none"
          />
        )}
      </div>
    </form>
  );
}
