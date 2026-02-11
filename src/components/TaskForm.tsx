"use client";

import { useState } from "react";
import { TaskType } from "@/lib/storage";

interface TaskFormProps {
  onAdd: (title: string, type: TaskType, category?: string) => void;
}

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("regular");
  const [category, setCategory] = useState("");
  const [showCategory, setShowCategory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, type, category.trim() || undefined);
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
          className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary placeholder:text-text-secondary focus:border-amber focus:outline-none shadow-lg shadow-black/20"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-xl bg-amber px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-amber-dark disabled:opacity-40 shadow-lg shadow-amber/20"
        >
          追加
        </button>
      </div>

      {/* Type toggle + Category */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-border shadow-md shadow-black/15">
          <button
            type="button"
            onClick={() => setType("regular")}
            className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
              type === "regular"
                ? "bg-amber text-white"
                : "bg-bg-secondary text-text-secondary"
            }`}
          >
            Regular
          </button>
          <button
            type="button"
            onClick={() => setType("one-off")}
            className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
              type === "one-off"
                ? "bg-amber text-white"
                : "bg-bg-secondary text-text-secondary"
            }`}
          >
            One-Off
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowCategory(!showCategory)}
          className="text-sm text-text-secondary hover:text-amber"
        >
          {showCategory ? "− カテゴリ" : "+ カテゴリ"}
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
