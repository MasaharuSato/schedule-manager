"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Category,
  Group,
  CategoryStore,
  loadCategoryStore,
  saveCategoryStore,
} from "@/lib/storage";

function getDescendantGroupIds(groupId: string, allGroups: Group[]): string[] {
  const ids: string[] = [];
  const children = allGroups.filter((g) => g.parentGroupId === groupId);
  for (const child of children) {
    ids.push(child.id);
    ids.push(...getDescendantGroupIds(child.id, allGroups));
  }
  return ids;
}

export function useCategories() {
  const [store, setStore] = useState<CategoryStore>({
    categories: [],
    groups: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStore(loadCategoryStore());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCategoryStore(store);
  }, [store, loaded]);

  // --- Category CRUD ---
  const addCategory = useCallback((name: string) => {
    const cat: Category = {
      id: crypto.randomUUID(),
      name,
      order: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      categories: [...prev.categories, cat],
    }));
    return cat.id;
  }, []);

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      setStore((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  const deleteCategory = useCallback((id: string) => {
    setStore((prev) => ({
      categories: prev.categories.filter((c) => c.id !== id),
      groups: prev.groups.filter((g) => g.categoryId !== id),
    }));
  }, []);

  // --- Group CRUD ---
  const addGroup = useCallback((name: string, categoryId: string, parentGroupId?: string) => {
    const group: Group = {
      id: crypto.randomUUID(),
      name,
      categoryId,
      parentGroupId: parentGroupId || undefined,
      order: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      groups: [...prev.groups, group],
    }));
    return group.id;
  }, []);

  const updateGroup = useCallback((id: string, updates: Partial<Group>) => {
    setStore((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setStore((prev) => {
      const descendantIds = getDescendantGroupIds(id, prev.groups);
      const idsToRemove = new Set([id, ...descendantIds]);
      return {
        ...prev,
        groups: prev.groups.filter((g) => !idsToRemove.has(g.id)),
      };
    });
  }, []);

  // --- Queries ---
  const getCategory = useCallback(
    (id: string) => store.categories.find((c) => c.id === id),
    [store.categories]
  );

  const getGroup = useCallback(
    (id: string) => store.groups.find((g) => g.id === id),
    [store.groups]
  );

  const getGroupsForCategory = useCallback(
    (categoryId: string) =>
      store.groups
        .filter((g) => g.categoryId === categoryId && !g.parentGroupId)
        .sort((a, b) => a.order - b.order),
    [store.groups]
  );

  const getSubGroups = useCallback(
    (parentGroupId: string) =>
      store.groups
        .filter((g) => g.parentGroupId === parentGroupId)
        .sort((a, b) => a.order - b.order),
    [store.groups]
  );

  const getDescendantIds = useCallback(
    (groupId: string) => getDescendantGroupIds(groupId, store.groups),
    [store.groups]
  );

  const sortedCategories = store.categories.sort(
    (a, b) => a.order - b.order
  );

  return {
    categories: sortedCategories,
    groups: store.groups,
    loaded,
    addCategory,
    updateCategory,
    deleteCategory,
    addGroup,
    updateGroup,
    deleteGroup,
    getCategory,
    getGroup,
    getGroupsForCategory,
    getSubGroups,
    getDescendantIds,
  };
}
