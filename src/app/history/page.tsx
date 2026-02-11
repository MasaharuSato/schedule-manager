"use client";

import { useState } from "react";
import { usePlans } from "@/hooks/usePlans";
import { formatDateLabel, getTodayString } from "@/lib/storage";

export default function HistoryPage() {
  const { plans, loaded, deletePlan, toggleDone } = usePlans();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const today = getTodayString();

  if (!loaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface px-5 py-4 shadow-lg shadow-black/30">
        <h1 className="text-xl font-bold text-text-primary">履歴</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {plans.length > 0
            ? `${plans.length}日分の予定`
            : "まだ予定がありません"}
        </p>
      </header>

      {/* Plan list */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
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
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <p className="text-base">履歴がありません</p>
          <p className="text-sm">「予定を組む」で予定を作成すると表示されます</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-3">
          {plans.map((plan) => {
            const doneCount = plan.entries.filter((e) => e.isDone).length;
            const totalCount = plan.entries.length;
            const isExpanded = expandedDate === plan.date;
            const isToday = plan.date === today;

            return (
              <div key={plan.date} className="rounded-xl bg-surface shadow-md shadow-black/25 overflow-hidden">
                {/* Day summary row */}
                <button
                  onClick={() =>
                    setExpandedDate(isExpanded ? null : plan.date)
                  }
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  {/* Date */}
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

                  {/* Progress circle */}
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

                  {/* Expand icon */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 text-text-secondary transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-bg-secondary/50">
                    {plan.entries.map((entry) => (
                      <button
                        key={entry.taskId}
                        onClick={() => toggleDone(plan.date, entry.taskId)}
                        className={`flex w-full items-center gap-4 px-7 py-3.5 text-left ${
                          entry.isDone ? "opacity-50" : ""
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            entry.isDone
                              ? "border-amber bg-amber"
                              : "border-text-secondary/40"
                          }`}
                        >
                          {entry.isDone && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold break-words ${
                              entry.isDone
                                ? "line-through text-text-secondary"
                                : "text-text-primary"
                            }`}
                          >
                            {entry.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                entry.type === "one-off"
                                  ? "bg-text-secondary/15 text-text-secondary"
                                  : "bg-amber/15 text-amber"
                              }`}
                            >
                              {entry.type === "one-off" ? "One-Off" : "Regular"}
                            </span>
                            {entry.category && (
                              <span className="inline-block rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] text-text-secondary">
                                {entry.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {/* Delete plan */}
                    <div className="flex justify-end px-5 py-3">
                      {confirmDelete === plan.date ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              deletePlan(plan.date);
                              setConfirmDelete(null);
                              setExpandedDate(null);
                            }}
                            className="rounded-lg bg-red-500/20 px-4 py-2 text-xs font-medium text-red-400"
                          >
                            削除する
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg border border-border px-4 py-2 text-xs text-text-secondary"
                          >
                            戻る
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(plan.date)}
                          className="text-xs text-text-secondary hover:text-red-400"
                        >
                          この予定を削除
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
