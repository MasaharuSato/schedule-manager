"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { usePlans } from "@/hooks/usePlans";
import { getTodayString, formatDateLabel } from "@/lib/storage";

export default function PlanPage() {
  const { tasks, loaded: tasksLoaded, deleteTasks } = useTasks();
  const { getPlan, saveDayPlan, toggleDone, loaded: plansLoaded } = usePlans();

  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"select" | "view">("select");

  const plan = getPlan(selectedDate);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
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

    // One-Off タスクのIDを先に計算（既存プランに含まれていないもの）
    const existingPlan = getPlan(selectedDate);
    const existingTaskIds = new Set(
      existingPlan?.entries.map((e) => e.taskId) ?? []
    );
    const oneOffToRemove = selected
      .filter((t) => t.type === "one-off" && !existingTaskIds.has(t.id))
      .map((t) => t.id);

    saveDayPlan(selectedDate, selected);

    if (oneOffToRemove.length > 0) {
      deleteTasks(oneOffToRemove);
    }
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
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-5 py-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">予定を組む</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {formatDateLabel(selectedDate)}
              {mode === "view" && totalCount > 0 && ` · ${doneCount}/${totalCount}件完了`}
            </p>
          </div>
          {mode === "view" && plan && (
            <button
              onClick={handleEdit}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              編集
            </button>
          )}
        </div>

        {/* Date selector */}
        <div className="mt-3 flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-amber focus:outline-none [color-scheme:dark]"
          />
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="rounded-lg bg-amber/15 px-4 py-2.5 text-sm font-medium text-amber"
            >
              今日
            </button>
          )}
        </div>

        {/* Progress bar (view mode) */}
        {mode === "view" && totalCount > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-secondary">
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
          <div className="px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-text-secondary bg-bg-secondary">
            タスクを選択
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
              <p className="text-base">タスクがありません</p>
              <p className="text-sm">先にタスク一覧でタスクを追加してください</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-4 py-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleSelect(task.id)}
                  className="flex items-center gap-4 rounded-xl bg-surface px-4 py-4 text-left shadow-md shadow-black/25"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      selectedIds.has(task.id)
                        ? "border-amber bg-amber"
                        : "border-text-secondary/40"
                    }`}
                  >
                    {selectedIds.has(task.id) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-text-primary leading-snug break-words">
                      {task.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          task.type === "one-off"
                            ? "bg-text-secondary/15 text-text-secondary"
                            : "bg-amber/15 text-amber"
                        }`}
                      >
                        {task.type === "one-off" ? "One-Off" : "Regular"}
                      </span>
                      {task.category && (
                        <span className="inline-block rounded-full bg-bg-secondary px-2.5 py-0.5 text-[11px] text-text-secondary">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Save button */}
          {selectedIds.size > 0 && (
            <div className="sticky bottom-20 px-5 py-4">
              <button
                onClick={handleSavePlan}
                className="w-full rounded-xl bg-amber py-4 text-base font-semibold text-white transition-colors hover:bg-amber-dark shadow-lg shadow-amber/20"
              >
                {selectedIds.size}件のタスクで予定を確定
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* View mode */}
          {plan && plan.entries.length > 0 ? (
            <div className="flex flex-col gap-2 px-4 py-3">
              {/* Undone */}
              {plan.entries
                .filter((e) => !e.isDone)
                .map((entry) => (
                  <button
                    key={entry.taskId}
                    onClick={() => toggleDone(selectedDate, entry.taskId)}
                    className="flex items-center gap-4 rounded-xl bg-surface px-4 py-4 text-left shadow-md shadow-black/25"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-text-secondary/40 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-text-primary leading-snug break-words">{entry.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            entry.type === "one-off"
                              ? "bg-text-secondary/15 text-text-secondary"
                              : "bg-amber/15 text-amber"
                          }`}
                        >
                          {entry.type === "one-off" ? "One-Off" : "Regular"}
                        </span>
                        {entry.category && (
                          <span className="inline-block rounded-full bg-bg-secondary px-2.5 py-0.5 text-[11px] text-text-secondary">
                            {entry.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              {/* Done */}
              {doneCount > 0 && (
                <>
                  <div className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-text-secondary">
                    完了済み
                  </div>
                  {plan.entries
                    .filter((e) => e.isDone)
                    .map((entry) => (
                      <button
                        key={entry.taskId}
                        onClick={() => toggleDone(selectedDate, entry.taskId)}
                        className="flex items-center gap-4 rounded-xl bg-surface px-4 py-4 text-left opacity-50 shadow-md shadow-black/25"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-amber bg-amber transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-text-secondary line-through leading-snug break-words">{entry.title}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                entry.type === "one-off"
                                  ? "bg-text-secondary/15 text-text-secondary"
                                  : "bg-amber/15 text-amber"
                              }`}
                            >
                              {entry.type === "one-off" ? "One-Off" : "Regular"}
                            </span>
                            {entry.category && (
                              <span className="inline-block rounded-full bg-bg-secondary px-2.5 py-0.5 text-[11px] text-text-secondary">
                                {entry.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
              <p className="text-base">この日の予定はまだありません</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
