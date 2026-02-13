const TASKS_KEY = "schedule-manager-tasks";
const PLANS_KEY = "schedule-manager-plans";
const CATEGORIES_KEY = "schedule-manager-categories";
const NOTES_KEY = "schedule-manager-notes";
const NOTE_FOLDERS_KEY = "schedule-manager-note-folders";

export type TaskType = "one-off" | "regular";

// --- Category / Group ---
export interface Category {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  categoryId: string;
  parentGroupId?: string;
  order: number;
  createdAt: string;
}

export interface CategoryStore {
  categories: Category[];
  groups: Group[];
}

// --- Task ---
export interface Task {
  id: string;
  title: string;
  categoryId?: string;
  groupId?: string;
  type: TaskType;
  createdAt: string;
}

// --- Day Plan ---
export interface DayTaskEntry {
  taskId: string;
  title: string;
  categoryId?: string;
  categoryName?: string;
  groupId?: string;
  groupName?: string;
  type: TaskType;
  isDone: boolean;
  note?: string;
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
    return parsed.map((t: Record<string, unknown>) => ({
      ...t,
      type: t.type || "regular",
    }));
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

// --- Category Store ---
export function loadCategoryStore(): CategoryStore {
  if (typeof window === "undefined") return { categories: [], groups: [] };
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : { categories: [], groups: [] };
  } catch {
    return { categories: [], groups: [] };
  }
}

export function saveCategoryStore(store: CategoryStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(store));
}

// --- Note Folders ---
export interface NoteFolder {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export function loadNoteFolders(): NoteFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTE_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNoteFolders(folders: NoteFolder[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTE_FOLDERS_KEY, JSON.stringify(folders));
}

// --- Notes ---
export interface Note {
  id: string;
  title: string;
  body: string;
  folderId?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// --- Data Export / Import ---
export interface ExportData {
  version: 1;
  exportedAt: string;
  tasks: Task[];
  plans: DayPlan[];
  categoryStore: CategoryStore;
  notes: Note[];
  noteFolders: NoteFolder[];
}

export function exportAllData(): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: loadTasks(),
    plans: loadPlans(),
    categoryStore: loadCategoryStore(),
    notes: loadNotes(),
    noteFolders: loadNoteFolders(),
  };
}

export function importAllData(data: ExportData): void {
  if (typeof window === "undefined") return;
  if (data.version !== 1) throw new Error("Unsupported data version");
  saveTasks(data.tasks ?? []);
  savePlans(data.plans ?? []);
  saveCategoryStore(data.categoryStore ?? { categories: [], groups: [] });
  saveNotes(data.notes ?? []);
  saveNoteFolders(data.noteFolders ?? []);
}

// --- Utility ---
export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getTaskColor(type: TaskType): string {
  return type === "one-off" ? "#3B82F6" : "#DC2626";
}

export function getTaskColorMuted(type: TaskType): string {
  return type === "one-off" ? "#1E3A5F" : "#5C1A1A";
}

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return `${Number(m)}/${Number(d)}（${days[date.getDay()]}）`;
}
