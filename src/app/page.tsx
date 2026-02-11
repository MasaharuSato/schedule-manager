"use client";

import { useTasks } from "@/hooks/useTasks";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";

export default function TaskListPage() {
  const { tasks, loaded, addTask, deleteTask, updateTask, toggleToday } =
    useTasks();

  if (!loaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary">タスク一覧</h1>
        <p className="text-xs text-text-secondary">
          {tasks.length}件のタスク
          {tasks.filter((t) => t.isToday).length > 0 &&
            ` · ${tasks.filter((t) => t.isToday).length}件が予定に追加済み`}
        </p>
      </header>

      {/* Add form */}
      <TaskForm onAdd={addTask} />

      {/* Task list */}
      <div className="flex flex-col">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-text-secondary">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-30"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="M13 8h4" />
              <path d="M13 12h4" />
              <path d="M13 16h4" />
            </svg>
            <p className="text-sm">タスクがありません</p>
            <p className="text-xs">上の入力欄からタスクを追加してください</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleToday={toggleToday}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
