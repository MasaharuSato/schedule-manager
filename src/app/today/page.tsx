"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { usePlans } from "@/hooks/usePlans";
import { getTodayString, formatDateLabel, getTaskColor } from "@/lib/storage";

export default function PlanPage() {
  const { tasks, loaded: tasksLoaded, deleteTasks } = useTasks();
  const { getPlan, saveDayPlan, toggleDone, loaded: plansLoaded } = usePlans();

  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "select" | "view">("date");

  const plan = getPlan(selectedDate);

  // select ステップに入った時、既存プランがあればpre-check
  useEffect(() => {
    if (step === "select" && plansLoaded) {
      if (plan) {
        setSelectedIds(new Set(plan.entries.map((e) => e.taskId)));
        setNotes(new Map(
          plan.entries.filter((e) => e.note).map((e) => [e.taskId, e.note!])
        ));
      } else {
        setSelectedIds(new Set());
        setNotes(new Map());
      }
    }
  }, [step, plansLoaded, plan]);

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

  const updateNote = (id: string, value: string) => {
    setNotes((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
  };

  const handleSavePlan = () => {
    const selected = tasks.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;

    const existingPlan = getPlan(selectedDate);
    const existingTaskIds = new Set(
      existingPlan?.entries.map((e) => e.taskId) ?? []
    );
    const oneOffToRemove = selected
      .filter((t) => t.type === "one-off" && !existingTaskIds.has(t.id))
      .map((t) => t.id);

    saveDayPlan(selectedDate, selected, notes);

    if (oneOffToRemove.length > 0) {
      deleteTasks(oneOffToRemove);
    }
    setStep("view");
  };

  const doneCount = plan?.entries.filter((e) => e.isDone).length ?? 0;
  const totalCount = plan?.entries.length ?? 0;

  // ─── Step 1: 日程を選ぶ ───
  if (step === "date") {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-surface px-5 py-4 shadow-lg shadow-black/30">
          <h1 className="text-xl font-bold text-text-primary">予定を組む</h1>
          <p className="text-sm text-text-secondary mt-0.5">日程を選んでください</p>
        </header>

        <div className="flex flex-col gap-5 px-5 py-6">
          {/* Date input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              日付
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3.5 text-base text-text-primary focus:border-amber focus:outline-none [color-scheme:dark] shadow-md shadow-black/20"
            />
          </div>

          {/* Today shortcut */}
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="self-start rounded-lg bg-amber/15 px-4 py-2.5 text-sm font-medium text-amber"
            >
              今日に戻す
            </button>
          )}

          {/* Selected date display */}
          <div className="rounded-xl bg-surface px-5 py-4 shadow-md shadow-black/25">
            <p className="text-lg font-bold text-text-primary">
              {formatDateLabel(selectedDate)}
            </p>
            {plan ? (
              <p className="text-sm text-amber mt-1">
                予定あり · {plan.entries.length}件のタスク
              </p>
            ) : (
              <p className="text-sm text-text-secondary mt-1">予定なし</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-2">
            {plan && (
              <button
                onClick={() => setStep("view")}
                className="w-full rounded-xl border border-amber bg-amber/10 py-4 text-base font-semibold text-amber shadow-md shadow-black/20"
              >
                この日の予定を見る
              </button>
            )}
            <button
              onClick={() => setStep("select")}
              className="w-full rounded-xl bg-amber py-4 text-base font-semibold text-white shadow-lg shadow-amber/20"
            >
              {plan ? "タスクを編集する" : "タスクを選ぶ"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: タスクを選ぶ・登録 ───
  if (step === "select") {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-surface px-5 py-4 shadow-lg shadow-black/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setStep("date");
                setSelectedIds(new Set());
                setNotes(new Map());
                setDetailOpenId(null);
              }}
              className="rounded-lg p-1 text-text-secondary"
              aria-label="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">タスクを選ぶ</h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {formatDateLabel(selectedDate)}
              </p>
            </div>
          </div>
        </header>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
            <p className="text-base">タスクがありません</p>
            <p className="text-sm">先にタスク一覧でタスクを追加してください</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-4 py-3">
            {tasks.map((task) => {
              const isSelected = selectedIds.has(task.id);
              const isDetailOpen = detailOpenId === task.id;
              const noteText = notes.get(task.id) ?? "";
              return (
                <div key={task.id} className="flex flex-col">
                  <div
                    className="flex items-center gap-4 rounded-xl bg-surface px-4 py-4 shadow-md shadow-black/25 border-l-[3px]"
                    style={{ borderLeftColor: getTaskColor(task.id) }}
                  >
                    <button
                      onClick={() => toggleSelect(task.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center"
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                          isSelected
                            ? "border-amber bg-amber"
                            : "border-text-secondary/40"
                        }`}
                      >
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (!isSelected) {
                          toggleSelect(task.id);
                          setDetailOpenId(task.id);
                        } else {
                          setDetailOpenId(isDetailOpen ? null : task.id);
                        }
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
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
                      {isSelected && !isDetailOpen && noteText && (
                        <p className="mt-1.5 text-sm text-text-secondary leading-snug break-words whitespace-pre-wrap">{noteText}</p>
                      )}
                    </button>
                  </div>
                  {isSelected && isDetailOpen && (
                    <div className="mx-2 rounded-b-xl bg-bg-secondary px-4 py-3 border border-t-0 border-border shadow-inner">
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">詳細</label>
                      <textarea
                        value={noteText}
                        onChange={(e) => updateNote(task.id, e.target.value)}
                        placeholder="詳細を入力..."
                        rows={4}
                        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-amber focus:outline-none leading-relaxed"
                        autoFocus
                      />
                      <button
                        onClick={() => setDetailOpenId(null)}
                        className="mt-2 w-full rounded-lg bg-amber/15 py-2 text-sm font-medium text-amber"
                      >
                        閉じる
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
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
      </div>
    );
  }

  // ─── Step 3: 予定表示 ───
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-5 py-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("date")}
              className="rounded-lg p-1 text-text-secondary"
              aria-label="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {formatDateLabel(selectedDate)}
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {totalCount > 0 ? `${doneCount}/${totalCount}件完了` : "予定なし"}
              </p>
            </div>
          </div>
          {plan && (
            <button
              onClick={() => setStep("select")}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              編集
            </button>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-secondary">
            <div
              className="h-full rounded-full bg-amber transition-all duration-300"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </header>

      {plan && plan.entries.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 py-3">
          {/* Undone */}
          {plan.entries
            .filter((e) => !e.isDone)
            .map((entry) => (
              <button
                key={entry.taskId}
                onClick={() => toggleDone(selectedDate, entry.taskId)}
                className="flex items-center gap-4 rounded-xl bg-surface px-4 py-4 text-left shadow-md shadow-black/25 border-l-[3px]"
                style={{ borderLeftColor: getTaskColor(entry.taskId) }}
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
                  {entry.note && (
                    <p className="mt-1.5 text-sm text-text-secondary leading-snug break-words whitespace-pre-wrap">{entry.note}</p>
                  )}
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
                    className="flex items-center gap-4 rounded-xl bg-surface px-4 py-4 text-left opacity-50 shadow-md shadow-black/25 border-l-[3px]"
                    style={{ borderLeftColor: getTaskColor(entry.taskId) }}
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
                      {entry.note && (
                        <p className="mt-1.5 text-sm text-text-secondary/70 line-through leading-snug break-words whitespace-pre-wrap">{entry.note}</p>
                      )}
                    </div>
                  </button>
                ))}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
          <p className="text-base">この日の予定はまだありません</p>
          <button
            onClick={() => setStep("select")}
            className="mt-2 rounded-lg bg-amber/15 px-5 py-2.5 text-sm font-medium text-amber"
          >
            タスクを選ぶ
          </button>
        </div>
      )}
    </div>
  );
}
