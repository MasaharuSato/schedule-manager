"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, loadTasks, saveTasks } from "@/lib/storage";

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

  const addTask = useCallback((title: string, category?: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      category: category || undefined,
      isToday: false,
      isDone: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const toggleToday = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isToday: !t.isToday, isDone: false } : t
      )
    );
  }, []);

  const toggleDone = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  }, []);

  const resetToday = useCallback(() => {
    setTasks((prev) =>
      prev.map((t) => ({ ...t, isToday: false, isDone: false }))
    );
  }, []);

  const todayTasks = tasks.filter((t) => t.isToday);

  return {
    tasks,
    todayTasks,
    loaded,
    addTask,
    deleteTask,
    updateTask,
    toggleToday,
    toggleDone,
    resetToday,
  };
}
