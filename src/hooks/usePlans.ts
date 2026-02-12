"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DayPlan,
  DayTaskEntry,
  Task,
  Category,
  Group,
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

  const saveDayPlan = useCallback(
    (
      date: string,
      selectedTasks: Task[],
      notes?: Map<string, string>,
      categories?: Category[],
      groups?: Group[]
    ): void => {
      setPlans((prev) => {
        const existing = prev.find((p) => p.date === date);

        const entries: DayTaskEntry[] = selectedTasks.map((t) => {
          const prevEntry = existing?.entries.find((e) => e.taskId === t.id);
          const noteValue = notes?.get(t.id);
          const cat = categories?.find((c) => c.id === t.categoryId);
          const grp = groups?.find((g) => g.id === t.groupId);
          return {
            taskId: t.id,
            title: t.title,
            categoryId: t.categoryId,
            categoryName: cat?.name ?? prevEntry?.categoryName,
            groupId: t.groupId,
            groupName: grp?.name ?? prevEntry?.groupName,
            type: t.type,
            isDone: prevEntry?.isDone ?? false,
            note: noteValue !== undefined ? noteValue : prevEntry?.note,
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
