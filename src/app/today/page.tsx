"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import TodayTaskItem from "@/components/TodayTaskItem";

export default function TodayPage() {
  const { todayTasks, loaded, toggleDone, resetToday } = useTasks();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!loaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  const doneCount = todayTasks.filter((t) => t.isDone).length;
  const totalCount = todayTasks.length;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">今日の予定</h1>
            <p className="text-xs text-text-secondary">
              {totalCount > 0
                ? `${doneCount}/${totalCount}件 完了`
                : "タスクが選択されていません"}
            </p>
          </div>
          {totalCount > 0 && (
            <div>
              {showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      resetToday();
                      setShowResetConfirm(false);
                    }}
                    className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    リセット
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary"
                  >
                    戻る
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  リセット
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-secondary">
            <div
              className="h-full rounded-full bg-amber transition-all duration-300"
              style={{
                width: `${(doneCount / totalCount) * 100}%`,
              }}
            />
          </div>
        )}
      </header>

      {/* Today task list */}
      <div className="flex flex-col">
        {totalCount === 0 ? (
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm">今日の予定はありません</p>
            <p className="text-xs">タスク一覧から「今日やる」を選択してください</p>
          </div>
        ) : (
          <>
            {/* Undone tasks first */}
            {todayTasks
              .filter((t) => !t.isDone)
              .map((task) => (
                <TodayTaskItem
                  key={task.id}
                  task={task}
                  onToggleDone={toggleDone}
                />
              ))}
            {/* Done tasks */}
            {doneCount > 0 && (
              <>
                <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary bg-bg-secondary">
                  完了済み
                </div>
                {todayTasks
                  .filter((t) => t.isDone)
                  .map((task) => (
                    <TodayTaskItem
                      key={task.id}
                      task={task}
                      onToggleDone={toggleDone}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
