"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DayPlan,
  DayTaskEntry,
  Task,
  loadPlans,
  savePlans,
  getTodayString,
} from "@/lib/storage";

export function usePlans() {
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlans(loadPlans());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      savePlans(plans);
    }
  }, [plans, loaded]);

  const getPlan = useCallback(
    (date: string): DayPlan | undefined => {
      return plans.find((p) => p.date === date);
    },
    [plans]
  );

  const getTodayPlan = useCallback((): DayPlan | undefined => {
    return plans.find((p) => p.date === getTodayString());
  }, [plans]);

  /**
   * 選択したタスクから日別プランを作成・更新
   * 戻り値: プランに新たに追加された one-off タスクのID一覧（プールから消す用）
   */
  const saveDayPlan = useCallback(
    (date: string, selectedTasks: Task[]): string[] => {
      let newOneOffIds: string[] = [];

      setPlans((prev) => {
        const existing = prev.find((p) => p.date === date);
        const existingTaskIds = new Set(
          existing?.entries.map((e) => e.taskId) ?? []
        );

        // 新たに追加された one-off を検出
        newOneOffIds = selectedTasks
          .filter((t) => t.type === "one-off" && !existingTaskIds.has(t.id))
          .map((t) => t.id);

        const entries: DayTaskEntry[] = selectedTasks.map((t) => {
          const prevEntry = existing?.entries.find((e) => e.taskId === t.id);
          return {
            taskId: t.id,
            title: t.title,
            category: t.category,
            type: t.type,
            isDone: prevEntry?.isDone ?? false,
          };
        });

        const plan: DayPlan = {
          date,
          entries,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };

        if (existing) {
          return prev.map((p) => (p.date === date ? plan : p));
        }
        return [plan, ...prev];
      });

      return newOneOffIds;
    },
    []
  );

  const toggleDone = useCallback((date: string, taskId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.date !== date) return p;
        return {
          ...p,
          entries: p.entries.map((e) =>
            e.taskId === taskId ? { ...e, isDone: !e.isDone } : e
          ),
        };
      })
    );
  }, []);

  const deletePlan = useCallback((date: string) => {
    setPlans((prev) => prev.filter((p) => p.date !== date));
  }, []);

  const sortedPlans = [...plans].sort((a, b) => b.date.localeCompare(a.date));

  return {
    plans: sortedPlans,
    loaded,
    getPlan,
    getTodayPlan,
    saveDayPlan,
    toggleDone,
    deletePlan,
  };
}
