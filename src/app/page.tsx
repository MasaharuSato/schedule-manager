"use client";

import { useState, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import { Task, getTaskColor, getTaskColorMuted } from "@/lib/storage";
import SwipeableItem from "@/components/SwipeableItem";
import AddItemSheet from "@/components/AddItemSheet";
import MoveTaskSheet from "@/components/MoveTaskSheet";

export default function TaskListPage() {
  const {
    tasks,
    loaded: tasksLoaded,
    addTask,
    deleteTask,
    updateTask,
    moveTask,
    orphanByCategory,
    orphanByGroup,
  } = useTasks();
  const {
    categories,
    groups,
    loaded: catsLoaded,
    addCategory,
    addGroup,
    deleteCategory,
    deleteGroup,
  } = useCategories();

  const [showAdd, setShowAdd] = useState(false);
  const [addDefaultCatId, setAddDefaultCatId] = useState<string | undefined>();
  const [addDefaultGroupId, setAddDefaultGroupId] = useState<string | undefined>();
  const [addDefaultMode, setAddDefaultMode] = useState<"task" | "category" | "group">("task");
  const [moveTarget, setMoveTarget] = useState<Task | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["__uncategorized"]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openAdd = useCallback(
    (mode: "task" | "category" | "group", catId?: string, grpId?: string) => {
      setAddDefaultMode(mode);
      setAddDefaultCatId(catId);
      setAddDefaultGroupId(grpId);
      setShowAdd(true);
    },
    []
  );

  const handleDeleteCategory = useCallback(
    (catId: string) => {
      orphanByCategory(catId);
      deleteCategory(catId);
    },
    [orphanByCategory, deleteCategory]
  );

  const handleDeleteGroup = useCallback(
    (grpId: string) => {
      orphanByGroup(grpId);
      deleteGroup(grpId);
    },
    [orphanByGroup, deleteGroup]
  );

  if (!tasksLoaded || !catsLoaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  // Group tasks by category and group
  const uncategorized = tasks.filter((t) => !t.categoryId);

  const renderTaskCard = (task: Task, index: number) => {
    const bgMuted = getTaskColorMuted(task.type);
    const color = getTaskColor(task.type);
    const isEditing = editingId === task.id;

    return (
      <div
        key={task.id}
        className="animate-slide-up"
        style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      >
        <SwipeableItem
          rightAction={
            <div className="flex gap-2">
              <button
                onClick={() => setMoveTarget(task)}
                className="rounded-xl bg-task-oneoff px-3 py-2 text-xs font-medium text-white"
              >
                移動
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="rounded-xl bg-task-regular px-3 py-2 text-xs font-medium text-white"
              >
                削除
              </button>
            </div>
          }
        >
          <div
            className="rounded-2xl px-4 py-3.5 shadow-lg shadow-black/30"
            style={{ backgroundColor: bgMuted }}
          >
            {isEditing ? (
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const trimmed = editTitle.trim();
                      if (trimmed) updateTask(task.id, { title: trimmed });
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-base text-text-primary focus:border-amber focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const trimmed = editTitle.trim();
                    if (trimmed) updateTask(task.id, { title: trimmed });
                    setEditingId(null);
                  }}
                  className="text-sm font-medium text-amber"
                >
                  保存
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  setEditingId(task.id);
                  setEditTitle(task.title);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-text-primary leading-snug break-words">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white/80"
                      style={{ backgroundColor: `${color}40` }}
                    >
                      {task.type === "one-off" ? "One-Off" : "Regular"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SwipeableItem>
      </div>
    );
  };

  const renderGroupSection = (
    groupId: string,
    groupName: string,
    groupTasks: Task[],
    catId: string
  ) => {
    const isExpanded = expanded.has(groupId);
    return (
      <div key={groupId} className="ml-3">
        <button
          onClick={() => toggleExpand(groupId)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-text-secondary transition-transform duration-300 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-sm font-semibold text-text-secondary">
            {groupName}
          </span>
          <span className="text-xs text-text-secondary/60">
            {groupTasks.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDeleteId === groupId) {
                handleDeleteGroup(groupId);
                setConfirmDeleteId(null);
              } else {
                setConfirmDeleteId(groupId);
                setTimeout(() => setConfirmDeleteId(null), 3000);
              }
            }}
            className="ml-auto text-text-secondary/40 hover:text-red-400 p-1"
          >
            {confirmDeleteId === groupId ? (
              <span className="text-xs text-red-400">削除</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            )}
          </button>
        </button>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isExpanded ? "2000px" : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="flex flex-col gap-2 pl-2 pb-2">
            {groupTasks.map((t, i) => renderTaskCard(t, i))}
            <button
              onClick={() => openAdd("task", catId, groupId)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-secondary/60 hover:text-text-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              ミッションを追加
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySection = (catId: string, catName: string) => {
    const isExpanded = expanded.has(catId);
    const catGroups = groups
      .filter((g) => g.categoryId === catId)
      .sort((a, b) => a.order - b.order);
    const catTasks = tasks.filter((t) => t.categoryId === catId);
    const directTasks = catTasks.filter((t) => !t.groupId);
    const totalCount = catTasks.length;

    return (
      <div key={catId} className="animate-slide-up">
        <button
          onClick={() => toggleExpand(catId)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-amber transition-transform duration-300 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-base font-bold text-text-primary tracking-tight">
            {catName}
          </span>
          <span className="rounded-full bg-surface-highlight px-2 py-0.5 text-xs text-text-secondary">
            {totalCount}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDeleteId === catId) {
                handleDeleteCategory(catId);
                setConfirmDeleteId(null);
              } else {
                setConfirmDeleteId(catId);
                setTimeout(() => setConfirmDeleteId(null), 3000);
              }
            }}
            className="ml-auto text-text-secondary/40 hover:text-red-400 p-1"
          >
            {confirmDeleteId === catId ? (
              <span className="text-xs text-red-400">削除</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            )}
          </button>
        </button>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isExpanded ? "5000px" : "0px",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="flex flex-col gap-2 px-3 pb-3">
            {/* Groups */}
            {catGroups.map((g) => {
              const grpTasks = tasks.filter((t) => t.groupId === g.id);
              return renderGroupSection(g.id, g.name, grpTasks, catId);
            })}

            {/* Direct tasks (in category but no group) */}
            {directTasks.map((t, i) => renderTaskCard(t, i))}

            {/* Add buttons */}
            <div className="flex gap-2 pl-2 pt-1">
              <button
                onClick={() => openAdd("task", catId)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-secondary/60 hover:text-text-secondary bg-surface-highlight/50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                ミッション
              </button>
              <button
                onClick={() => openAdd("group", catId)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-secondary/60 hover:text-text-secondary bg-surface-highlight/50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                グループ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border header-gradient px-5 py-4 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              ミッション一覧
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {tasks.length}件のミッション
            </p>
          </div>
          <button
            onClick={() => openAdd("task")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber shadow-lg shadow-amber/20"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {tasks.length === 0 && categories.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-text-secondary animate-fade-in">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-30"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
            <path d="M13 8h4" />
            <path d="M13 12h4" />
            <path d="M13 16h4" />
          </svg>
          <p className="text-base">ミッションがありません</p>
          <p className="text-sm">右上の＋ボタンからミッションを追加してください</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 py-3 pb-8">
          {/* Category sections */}
          {categories.map((cat) =>
            renderCategorySection(cat.id, cat.name)
          )}

          {/* Uncategorized section */}
          {uncategorized.length > 0 && (
            <div>
              <button
                onClick={() => toggleExpand("__uncategorized")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-text-secondary transition-transform duration-300 ${
                    expanded.has("__uncategorized") ? "rotate-90" : ""
                  }`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-base font-bold text-text-secondary tracking-tight">
                  未分類
                </span>
                <span className="rounded-full bg-surface-highlight px-2 py-0.5 text-xs text-text-secondary">
                  {uncategorized.length}
                </span>
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: expanded.has("__uncategorized") ? "5000px" : "0px",
                  opacity: expanded.has("__uncategorized") ? 1 : 0,
                }}
              >
                <div className="flex flex-col gap-2 px-3 pb-3">
                  {uncategorized.map((t, i) => renderTaskCard(t, i))}
                </div>
              </div>
            </div>
          )}

          {/* Add category button */}
          <button
            onClick={() => openAdd("category")}
            className="flex items-center gap-2 mx-4 mt-2 mb-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-secondary/60 hover:text-text-secondary hover:border-text-secondary/30 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            カテゴリを追加
          </button>
        </div>
      )}

      {/* Sheets */}
      <AddItemSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        categories={categories}
        groups={groups}
        onAddCategory={addCategory}
        onAddGroup={addGroup}
        onAddTask={addTask}
        defaultCategoryId={addDefaultCatId}
        defaultGroupId={addDefaultGroupId}
        defaultMode={addDefaultMode}
      />
      <MoveTaskSheet
        isOpen={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        task={moveTarget}
        categories={categories}
        groups={groups}
        onMove={moveTask}
      />
    </div>
  );
}
