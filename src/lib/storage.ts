const STORAGE_KEY = "schedule-manager-tasks";

export interface Task {
  id: string;
  title: string;
  category?: string;
  isToday: boolean;
  isDone: boolean;
  createdAt: string;
}

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
