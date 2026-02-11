"use client";

import { useState } from "react";
import { Task } from "@/lib/storage";

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export default function TaskItem({
  task,
  onDelete,
  onUpdate,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      onUpdate(task.id, { title: trimmed });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3">
      {/* Bullet */}
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="flex-1 rounded-md border border-border bg-bg-secondary px-2 py-1 text-sm text-text-primary focus:border-amber focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-xs font-medium text-amber"
            >
              保存
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-primary leading-snug break-words">
              {task.title}
            </p>
            {task.category && (
              <span className="mt-1 inline-block rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
                {task.category}
              </span>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => {
              setEditTitle(task.title);
              setIsEditing(true);
            }}
            className="rounded p-1.5 text-text-secondary hover:text-text-primary"
            aria-label="編集"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          {showConfirm ? (
            <button
              onClick={() => onDelete(task.id)}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-400 border border-red-400/40"
            >
              削除
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              onBlur={() => setTimeout(() => setShowConfirm(false), 200)}
              className="rounded p-1.5 text-text-secondary hover:text-red-500"
              aria-label="削除"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
