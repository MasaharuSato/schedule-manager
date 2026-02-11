"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { usePlans } from "@/hooks/usePlans";
import { getTodayString, formatDateLabel } from "@/lib/storage";

export default function PlanPage() {
  const { tasks, loaded: tasksLoaded } = useTasks();
  const { getPlan, saveDayPlan, toggleDone, loaded: plansLoaded } = usePlans();

  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"select" | "view">("select");

  const plan = getPlan(selectedDate);

  // プランが既にある場合は表示モード、選択済みIDを復元
  useEffect(() => {
    if (!plansLoaded) return;
    if (plan) {
      setSelectedIds(new Set(plan.entries.map((e) => e.taskId)));
      setMode("view");
    } else {
      setSelectedIds(new Set());
      setMode("select");
    }
  }, [selectedDate, plansLoaded, plan]);

  if (!tasksLoaded || !plansLoaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePlan = () => {
    const selected = tasks.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;
    saveDayPlan(selectedDate, selected);
    setMode("view");
  };

  const handleEdit = () => {
    setMode("select");
  };

  const doneCount = plan?.entries.filter((e) => e.isDone).length ?? 0;
  const totalCount = plan?.entries.length ?? 0;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">予定を組む</h1>
            <p className="text-xs text-text-secondary">
              {formatDateLabel(selectedDate)}
              {mode === "view" && totalCount > 0 && ` · ${doneCount}/${totalCount}件完了`}
            </p>
          </div>
          {mode === "view" && plan && (
            <button
              onClick={handleEdit}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              編集
            </button>
          )}
        </div>

        {/* Date selector */}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 rounded-md border border-border bg-bg-secondary px-2 py-1.5 text-xs text-text-primary focus:border-amber focus:outline-none [color-scheme:dark]"
          />
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="rounded-md bg-amber/15 px-2.5 py-1.5 text-xs font-medium text-amber"
            >
              今日
            </button>
          )}
        </div>

        {/* Progress bar (view mode) */}
        {mode === "view" && totalCount > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-secondary">
            <div
              className="h-full rounded-full bg-amber transition-all duration-300"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Content */}
      {mode === "select" ? (
        <>
          {/* Task selection list */}
          <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary bg-bg-secondary">
            タスクを選択
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-text-secondary">
              <p className="text-sm">タスクがありません</p>
              <p className="text-xs">先にタスク一覧でタスクを追加してください</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleSelect(task.id)}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 text-left"
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      selectedIds.has(task.id)
                        ? "border-amber bg-amber"
                        : "border-text-secondary/40"
                    }`}
                  >
                    {selectedIds.has(task.id) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary leading-snug break-words">
                      {task.title}
                    </p>
                    {task.category && (
                      <span className="mt-0.5 inline-block rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
                        {task.category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Save button */}
          {selectedIds.size > 0 && (
            <div className="sticky bottom-16 px-4 py-3">
              <button
                onClick={handleSavePlan}
                className="w-full rounded-lg bg-amber py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-dark"
              >
                {selectedIds.size}件のタスクで予定を確定
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* View mode - show plan entries with done toggle */}
          {plan && plan.entries.length > 0 ? (
            <div className="flex flex-col">
              {/* Undone */}
              {plan.entries
                .filter((e) => !e.isDone)
                .map((entry) => (
                  <button
                    key={entry.taskId}
                    onClick={() => toggleDone(selectedDate, entry.taskId)}
                    className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-text-secondary/40 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-snug break-words">{entry.title}</p>
                      {entry.category && (
                        <span className="mt-0.5 inline-block rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
                          {entry.category}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              {/* Done */}
              {doneCount > 0 && (
                <>
                  <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary bg-bg-secondary">
                    完了済み
                  </div>
                  {plan.entries
                    .filter((e) => e.isDone)
                    .map((entry) => (
                      <button
                        key={entry.taskId}
                        onClick={() => toggleDone(selectedDate, entry.taskId)}
                        className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left opacity-50"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-amber bg-amber transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-secondary line-through leading-snug break-words">{entry.title}</p>
                          {entry.category && (
                            <span className="mt-0.5 inline-block rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
                              {entry.category}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-16 text-text-secondary">
              <p className="text-sm">この日の予定はまだありません</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
