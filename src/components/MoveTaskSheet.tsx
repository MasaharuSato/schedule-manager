"use client";

import { useState } from "react";
import { Task, Category, Group } from "@/lib/storage";
import BottomSheet from "./BottomSheet";

interface MoveTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  categories: Category[];
  groups: Group[];
  onMove: (taskId: string, categoryId?: string, groupId?: string) => void;
}

export default function MoveTaskSheet({
  isOpen,
  onClose,
  task,
  categories,
  groups,
  onMove,
}: MoveTaskSheetProps) {
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? "");
  const [groupId, setGroupId] = useState(task?.groupId ?? "");

  const filteredGroups = categoryId
    ? groups.filter((g) => g.categoryId === categoryId)
    : [];

  const handleMove = () => {
    if (!task) return;
    onMove(task.id, categoryId || undefined, groupId || undefined);
    onClose();
  };

  // Reset state when task changes
  if (task && (categoryId !== (task.categoryId ?? "") || groupId !== (task.groupId ?? ""))) {
    // Only reset on first open
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={task ? `「${task.title}」を移動` : "移動"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            カテゴリ
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setGroupId("");
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

        {categoryId && filteredGroups.length > 0 && (
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
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleMove}
          className="w-full rounded-xl bg-amber py-3.5 text-base font-semibold text-white transition-colors hover:bg-amber-dark mt-2"
        >
          移動する
        </button>
      </div>
    </BottomSheet>
  );
}
