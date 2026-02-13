"use client";

import { useCallback, useRef, useState } from "react";
import { exportAllData, importAllData, ExportData } from "@/lib/storage";

interface DataTransferProps {
  open: boolean;
  onClose: () => void;
}

export default function DataTransfer({ open, onClose }: DataTransferProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleExport = useCallback(() => {
    const data = exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `lifer-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("success");
    setMessage("エクスポートしました");
    setTimeout(() => setStatus("idle"), 2000);
  }, []);

  const handleImport = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ExportData;
        if (!data.version || !data.tasks) {
          throw new Error("Invalid format");
        }
        importAllData(data);
        setStatus("success");
        setMessage("インポート完了。リロードします...");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setStatus("error");
        setMessage("無効なファイルです");
        setTimeout(() => setStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-surface-elevated px-6 pb-10 pt-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-secondary/30" />

        <h2 className="text-lg font-bold text-text-primary mb-1">
          データ管理
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          他のデバイスへデータを移行できます
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 rounded-2xl bg-surface-highlight px-5 py-4 text-left active:opacity-70 transition-opacity"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">エクスポート</p>
              <p className="text-xs text-text-secondary">JSONファイルとして保存</p>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-3 rounded-2xl bg-surface-highlight px-5 py-4 text-left active:opacity-70 transition-opacity"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">インポート</p>
              <p className="text-xs text-text-secondary">JSONファイルから復元（上書き）</p>
            </div>
          </button>
        </div>

        {status !== "idle" && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in ${
            status === "success" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
          }`}>
            {message}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={onFileChange}
        />

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-border py-3.5 text-base font-medium text-text-secondary active:opacity-70"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
