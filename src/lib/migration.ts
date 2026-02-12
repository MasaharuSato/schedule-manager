import {
  loadTasks,
  saveTasks,
  loadPlans,
  savePlans,
  loadCategoryStore,
  saveCategoryStore,
  Category,
} from "./storage";

const MIGRATION_KEY = "schedule-manager-migration-v2";

export function runMigrationV2(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_KEY)) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks = loadTasks() as any[];

  // Extract unique category strings from old tasks
  const categoryStrings = [
    ...new Set(
      tasks
        .map((t) => t.category as string | undefined)
        .filter((c): c is string => !!c)
    ),
  ];

  // Create Category objects
  const categoryMap = new Map<string, string>();
  const categories: Category[] = categoryStrings.map((name, i) => {
    const id = crypto.randomUUID();
    categoryMap.set(name, id);
    return { id, name, order: i, createdAt: new Date().toISOString() };
  });

  // Migrate tasks: replace `category` string with `categoryId`
  const migratedTasks = tasks.map((t) => {
    const categoryStr = t.category as string | undefined;
    const { category: _, ...rest } = t;
    return {
      ...rest,
      categoryId: categoryStr ? categoryMap.get(categoryStr) : undefined,
      groupId: undefined,
    };
  });

  saveTasks(migratedTasks as ReturnType<typeof loadTasks>);

  // Only save category store if we have new categories and no existing store
  const existingStore = loadCategoryStore();
  if (existingStore.categories.length === 0 && categories.length > 0) {
    saveCategoryStore({ categories, groups: [] });
  }

  // Migrate plans
  const plans = loadPlans();
  const migratedPlans = plans.map((p) => ({
    ...p,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entries: p.entries.map((e: any) => {
      const categoryStr = e.category as string | undefined;
      const catId = categoryStr ? categoryMap.get(categoryStr) : undefined;
      return {
        taskId: e.taskId,
        title: e.title,
        categoryId: catId,
        categoryName: categoryStr,
        groupId: undefined,
        groupName: undefined,
        type: e.type,
        isDone: e.isDone,
        note: e.note,
      };
    }),
  }));
  savePlans(migratedPlans as ReturnType<typeof loadPlans>);

  localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
}
