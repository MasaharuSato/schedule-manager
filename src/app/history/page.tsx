"use client";

import { useState, useCallback } from "react";
import { usePlans } from "@/hooks/usePlans";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";
import { formatDateLabel, getTodayString, getTaskColor, getTaskColorMuted } from "@/lib/storage";

export default function HistoryPage() {
  const { plans, loaded, deletePlan, toggleDone } = usePlans();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const today = getTodayString();
  const selectedPlan = selectedDate
    ? plans.find((p) => p.date === selectedDate)
    : null;

  const goBack = useCallback(() => {
    setDirection("back");
    setSelectedDate(null);
    setConfirmDelete(false);
  }, []);

  useEdgeSwipeBack(
    useCallback(() => {
      if (selectedDate) goBack();
    }, [selectedDate, goBack])
  );

  if (!loaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  // ─── Detail view (full screen) ───
  if (selectedDate && selectedPlan) {
    const doneCount = selectedPlan.entries.filter((e) => e.isDone).length;
    const totalCount = selectedPlan.entries.length;

    const animClass =
      direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

    return (
      <div className={`flex flex-col ${animClass}`}>
        <header className="sticky top-0 z-40 border-b border-border header-gradient px-5 py-4 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="rounded-lg p-1 text-text-secondary"
                aria-label="戻る"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  {formatDateLabel(selectedDate)}
                </h1>
                <p className="text-sm text-text-secondary mt-0.5">
                  {doneCount}/{totalCount}件完了
                </p>
              </div>
            </div>
          </div>

          {totalCount > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-secondary">
              <div
                className="h-full rounded-full bg-amber transition-all duration-300"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </header>

        <div className="flex flex-col gap-2 px-4 py-3">
          {/* Undone */}
          {selectedPlan.entries
            .filter((e) => !e.isDone)
            .map((entry, index) => (
              <button
                key={entry.taskId}
                onClick={() => toggleDone(selectedDate, entry.taskId)}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 text-left shadow-md shadow-black/25 animate-slide-up"
                style={{
                  backgroundColor: getTaskColorMuted(entry.type),
                  animationDelay: `${Math.min(index, 10) * 40}ms`,
                }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-text-secondary/40 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-text-primary leading-snug break-words">
                    {entry.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white/80"
                      style={{
                        backgroundColor: `${getTaskColor(entry.type)}40`,
                      }}
                    >
                      {entry.type === "one-off" ? "One-Off" : "Regular"}
                    </span>
                    {entry.categoryName && (
                      <span className="inline-block rounded-full bg-surface-highlight px-2.5 py-0.5 text-[11px] text-text-secondary">
                        {entry.categoryName}
                      </span>
                    )}
                  </div>
                  {entry.note && (
                    <p className="mt-1.5 text-sm text-text-secondary leading-snug break-words whitespace-pre-wrap">
                      {entry.note}
                    </p>
                  )}
                </div>
              </button>
            ))}

          {/* Done */}
          {doneCount > 0 && (
            <>
              <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-text-secondary">
                完了済み
              </div>
              {selectedPlan.entries
                .filter((e) => e.isDone)
                .map((entry) => (
                  <button
                    key={entry.taskId}
                    onClick={() => toggleDone(selectedDate, entry.taskId)}
                    className="flex items-center gap-4 rounded-2xl px-4 py-4 text-left opacity-50 shadow-md shadow-black/25"
                    style={{
                      backgroundColor: getTaskColorMuted(entry.type),
                    }}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-amber bg-amber transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-text-secondary line-through leading-snug break-words">
                        {entry.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white/60"
                          style={{
                            backgroundColor: `${getTaskColor(entry.type)}30`,
                          }}
                        >
                          {entry.type === "one-off" ? "One-Off" : "Regular"}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="mt-1.5 text-sm text-text-secondary/70 line-through leading-snug break-words whitespace-pre-wrap">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
            </>
          )}
        </div>

        {/* Delete button */}
        <div className="px-5 py-4">
          {confirmDelete ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <button
                onClick={() => {
                  deletePlan(selectedDate);
                  setSelectedDate(null);
                  setConfirmDelete(false);
                }}
                className="flex-1 rounded-2xl bg-red-500/20 py-3 text-sm font-medium text-red-400"
              >
                削除する
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-2xl border border-border py-3 text-sm text-text-secondary"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full text-center text-sm text-text-secondary hover:text-red-400 transition-colors"
            >
              この予定を削除
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── List view ───
  const animClass =
    direction === "back" ? "animate-slide-in-left" : "animate-fade-in";

  return (
    <div className={`flex flex-col ${animClass}`}>
      <header className="sticky top-0 z-40 border-b border-border header-gradient px-5 py-4 shadow-lg shadow-black/30">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          確認
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {plans.length > 0
            ? `${plans.length}日分の予定`
            : "まだ予定がありません"}
        </p>
      </header>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-text-secondary animate-fade-in">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-30"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p className="text-base">予定がありません</p>
          <p className="text-sm">
            「予定を組む」で予定を作成すると表示されます
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-3">
          {plans.map((plan, index) => {
            const doneCount = plan.entries.filter((e) => e.isDone).length;
            const totalCount = plan.entries.length;
            const isToday = plan.date === today;

            return (
              <button
                key={plan.date}
                onClick={() => {
                  setDirection("forward");
                  setSelectedDate(plan.date);
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-surface-elevated px-5 py-4 text-left shadow-md shadow-black/25 animate-slide-up"
                style={{
                  animationDelay: `${Math.min(index, 10) * 40}ms`,
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-text-primary">
                      {formatDateLabel(plan.date)}
                    </p>
                    {isToday && (
                      <span className="rounded-md bg-amber/15 px-2 py-0.5 text-xs font-medium text-amber">
                        今日
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {totalCount}件 · {doneCount}件完了
                  </p>
                </div>

                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-bg-secondary"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${(doneCount / totalCount) * 113} 113`}
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                      className="text-amber"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-text-secondary">
                    {Math.round((doneCount / totalCount) * 100)}%
                  </span>
                </div>

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-text-secondary"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
