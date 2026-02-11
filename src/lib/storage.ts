const TASKS_KEY = "schedule-manager-tasks";
const PLANS_KEY = "schedule-manager-plans";

export type TaskType = "one-off" | "regular";

export interface Task {
  id: string;
  title: string;
  category?: string;
  type: TaskType;
  createdAt: string;
}

export interface DayTaskEntry {
  taskId: string;
  title: string;
  category?: string;
  type: TaskType;
  isDone: boolean;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  entries: DayTaskEntry[];
  createdAt: string;
}

// --- Tasks ---
export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // migrate: old tasks without type default to "regular"
    return parsed.map((t: Task) => ({ ...t, type: t.type || "regular" }));
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// --- Day Plans ---
export function loadPlans(): DayPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlans(plans: DayPlan[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return `${Number(m)}/${Number(d)}（${days[date.getDay()]}）`;
}
