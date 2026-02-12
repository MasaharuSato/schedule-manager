"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Category,
  Group,
  CategoryStore,
  loadCategoryStore,
  saveCategoryStore,
} from "@/lib/storage";

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
  const addGroup = useCallback((name: string, categoryId: string) => {
    const group: Group = {
      id: crypto.randomUUID(),
      name,
      categoryId,
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
    setStore((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== id),
    }));
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
        .filter((g) => g.categoryId === categoryId)
        .sort((a, b) => a.order - b.order),
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
  };
}
