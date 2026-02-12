"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, TaskType, loadTasks, saveTasks } from "@/lib/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveTasks(tasks);
    }
  }, [tasks, loaded]);

  const addTask = useCallback(
    (title: string, type: TaskType, categoryId?: string, groupId?: string) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        categoryId: categoryId || undefined,
        groupId: groupId || undefined,
        type,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    },
    []
  );

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const deleteTasks = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const moveTask = useCallback(
    (taskId: string, categoryId?: string, groupId?: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, categoryId, groupId } : t
        )
      );
    },
    []
  );

  // Orphan tasks when a category or group is deleted
  const orphanByCategory = useCallback((categoryId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.categoryId === categoryId
          ? { ...t, categoryId: undefined, groupId: undefined }
          : t
      )
    );
  }, []);

  const orphanByGroup = useCallback((groupId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.groupId === groupId ? { ...t, groupId: undefined } : t
      )
    );
  }, []);

  return {
    tasks,
    loaded,
    addTask,
    deleteTask,
    deleteTasks,
    updateTask,
    moveTask,
    orphanByCategory,
    orphanByGroup,
  };
}
