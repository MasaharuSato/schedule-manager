"use client";

import { useState, useEffect, useMemo } from "react";
import { TaskType, Category, Group } from "@/lib/storage";
import BottomSheet from "./BottomSheet";

type AddMode = "category" | "group" | "task";

interface FlatGroupOption {
  id: string;
  label: string;
  depth: number;
}

function buildFlatGroupOptions(
  groups: Group[],
  categoryId: string,
  parentId?: string,
  depth: number = 0
): FlatGroupOption[] {
  const result: FlatGroupOption[] = [];
  const children = groups
    .filter((g) => g.categoryId === categoryId && (g.parentGroupId ?? undefined) === parentId)
    .sort((a, b) => a.order - b.order);
  for (const g of children) {
    const prefix = depth > 0 ? "─ ".repeat(depth) : "";
    result.push({ id: g.id, label: `${prefix}${g.name}`, depth });
    result.push(...buildFlatGroupOptions(groups, categoryId, g.id, depth + 1));
  }
  return result;
}

interface AddItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  groups: Group[];
  onAddCategory: (name: string) => void;
  onAddGroup: (name: string, categoryId: string, parentGroupId?: string) => void;
  onAddTask: (
    title: string,
    type: TaskType,
    categoryId?: string,
    groupId?: string
  ) => void;
  defaultCategoryId?: string;
  defaultGroupId?: string;
  defaultParentGroupId?: string;
  defaultMode?: AddMode;
}

export default function AddItemSheet({
  isOpen,
  onClose,
  categories,
  groups,
  onAddCategory,
  onAddGroup,
  onAddTask,
  defaultCategoryId,
  defaultGroupId,
  defaultParentGroupId,
  defaultMode = "task",
}: AddItemSheetProps) {
  const [mode, setMode] = useState<AddMode>(defaultMode);
  const [name, setName] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("regular");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [parentGroupId, setParentGroupId] = useState(defaultParentGroupId ?? "");

  // Sync defaults when sheet opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setCategoryId(defaultCategoryId ?? "");
      setGroupId(defaultGroupId ?? "");
      setParentGroupId(defaultParentGroupId ?? "");
      setName("");
    }
  }, [isOpen, defaultMode, defaultCategoryId, defaultGroupId, defaultParentGroupId]);

  const groupOptions = useMemo(
    () => (categoryId ? buildFlatGroupOptions(groups, categoryId) : []),
    [groups, categoryId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (mode === "category") {
      onAddCategory(trimmed);
    } else if (mode === "group") {
      if (!categoryId) return;
      onAddGroup(trimmed, categoryId, parentGroupId || undefined);
    } else {
      onAddTask(
        trimmed,
        taskType,
        categoryId || undefined,
        groupId || undefined
      );
    }

    setName("");
    setGroupId("");
    setParentGroupId("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setGroupId("");
    setParentGroupId("");
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="追加">
      {/* Mode selector */}
      <div className="flex gap-2 mb-5">
        {(["task", "category", "group"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setName("");
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-amber text-white"
                : "bg-surface-highlight text-text-secondary"
            }`}
          >
            {m === "task"
              ? "ミッション"
              : m === "category"
              ? "カテゴリ"
              : "グループ"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            mode === "category"
              ? "カテゴリ名"
              : mode === "group"
              ? "グループ名"
              : "ミッション名"
          }
          className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3.5 text-base text-text-primary placeholder:text-text-secondary/50 focus:border-amber focus:outline-none"
          autoFocus
        />

        {/* Category picker (for group and task modes) */}
        {(mode === "group" || mode === "task") && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              カテゴリ
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setGroupId("");
                setParentGroupId("");
              }}
              className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary focus:border-amber focus:outline-none [color-scheme:dark]"
            >
              <option value="">未分類</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Parent group picker (for group mode - to create sub-groups) */}
        {mode === "group" && categoryId && groupOptions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              親グループ
            </label>
            <select
              value={parentGroupId}
              onChange={(e) => setParentGroupId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary focus:border-amber focus:outline-none [color-scheme:dark]"
            >
              <option value="">なし（トップレベル）</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Group picker (for task mode only) */}
        {mode === "task" && categoryId && groupOptions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              グループ
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary focus:border-amber focus:outline-none [color-scheme:dark]"
            >
              <option value="">グループなし</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Task type toggle */}
        {mode === "task" && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              タイプ
            </label>
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => setTaskType("regular")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  taskType === "regular"
                    ? "bg-task-regular text-white"
                    : "bg-bg-secondary text-text-secondary"
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setTaskType("one-off")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  taskType === "one-off"
                    ? "bg-task-oneoff text-white"
                    : "bg-bg-secondary text-text-secondary"
                }`}
              >
                One-Off
              </button>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={
            !name.trim() || (mode === "group" && !categoryId)
          }
          className="w-full rounded-xl bg-amber py-3.5 text-base font-semibold text-white transition-colors hover:bg-amber-dark disabled:opacity-40 mt-2"
        >
          追加する
        </button>

        <div className="h-10" />
      </form>
    </BottomSheet>
  );
}
