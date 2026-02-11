"use client";

import { Task } from "@/lib/storage";

interface TodayTaskItemProps {
  task: Task;
  onToggleDone: (id: string) => void;
}

export default function TodayTaskItem({ task, onToggleDone }: TodayTaskItemProps) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-border px-4 py-3.5 transition-opacity ${
        task.isDone ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggleDone(task.id)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          task.isDone
            ? "border-amber bg-amber"
            : "border-gray-300"
        }`}
        aria-label={task.isDone ? "未完了に戻す" : "完了にする"}
      >
        {task.isDone && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug break-words ${
            task.isDone
              ? "line-through text-text-secondary"
              : "text-text-primary"
          }`}
        >
          {task.title}
        </p>
        {task.category && (
          <span className="mt-0.5 inline-block rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
            {task.category}
          </span>
        )}
      </div>
    </div>
  );
}
