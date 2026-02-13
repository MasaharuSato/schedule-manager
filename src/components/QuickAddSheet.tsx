"use client";

import { useState, useEffect } from "react";
import { TaskType } from "@/lib/storage";
import BottomSheet from "./BottomSheet";

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "task" | "subgroup";
  groupName: string;
  onAddTask: (title: string, type: TaskType) => void;
  onAddSubGroup: (name: string) => void;
}

export default function QuickAddSheet({
  isOpen,
  onClose,
  mode,
  groupName,
  onAddTask,
  onAddSubGroup,
}: QuickAddSheetProps) {
  const [name, setName] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("regular");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setTaskType("regular");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (mode === "task") {
      onAddTask(trimmed, taskType);
    } else {
      onAddSubGroup(trimmed);
    }

    setName("");
    onClose();
  };

  const title = mode === "task"
    ? `${groupName} にミッション追加`
    : `${groupName} にサブグループ追加`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={mode === "task" ? "ミッション名" : "サブグループ名"}
          className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3.5 text-base text-text-primary placeholder:text-text-secondary/50 focus:border-amber focus:outline-none"
          autoFocus
        />

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

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-xl bg-amber py-3.5 text-base font-semibold text-white transition-colors hover:bg-amber-dark disabled:opacity-40 mt-2"
        >
          追加する
        </button>

        <div className="h-10" />
      </form>
    </BottomSheet>
  );
}
