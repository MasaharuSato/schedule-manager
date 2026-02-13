"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { loadNotes, saveNotes } from "@/lib/storage";
import { useEdgeSwipeBack } from "@/hooks/useEdgeSwipeBack";

/* ── Direct storage ops (bypass React state) ── */

function saveNoteDirect(id: string, title: string, body: string) {
  const all = loadNotes();
  const now = new Date().toISOString();
  saveNotes(
    all.map((n) => (n.id === id ? { ...n, title, body, updatedAt: now } : n))
  );
}

function deleteNoteDirect(id: string) {
  saveNotes(loadNotes().filter((n) => n.id !== id));
}

/* ══════════════════════════════════════════ */

interface NoteEditorProps {
  noteId: string;
  initTitle: string;
  initBody: string;
  onBack: () => void;
}

export const NoteEditor = memo(function NoteEditor({
  noteId, initTitle, initBody, onBack,
}: NoteEditorProps) {
  const titleEl = useRef<HTMLInputElement>(null);
  const bodyEl = useRef<HTMLTextAreaElement>(null);
  const scrollEl = useRef<HTMLDivElement>(null);
  const tv = useRef(initTitle);
  const bv = useRef(initBody);
  const stick = useRef(true);

  const save = useCallback(() => {
    saveNoteDirect(noteId, tv.current, bv.current);
  }, [noteId]);

  const flush = useCallback(() => {
    const t = tv.current.trim();
    const b = bv.current.trim();
    if (!t && !b) deleteNoteDirect(noteId);
    else saveNoteDirect(noteId, tv.current, bv.current);
  }, [noteId]);

  /* ── Wire up events ── */
  useEffect(() => {
    const tEl = titleEl.current!;
    const bEl = bodyEl.current!;
    const sEl = scrollEl.current!;
    let followRaf = 0;
    let scrollTimer = 0;
    let programmaticScroll = false;

    stick.current = true;
    let wasOverflowing = sEl.scrollHeight > sEl.clientHeight;
    let prevLen = bEl.value.length;

    /* ── Reusable mirror div (avoid repeated DOM create/remove) ── */
    const mirror = document.createElement("div");
    mirror.style.cssText =
      "position:absolute;top:-9999px;left:-9999px;visibility:hidden;pointer-events:none;" +
      "white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;padding:0;border:none;";
    document.body.appendChild(mirror);
    let cachedFont = "";
    let cachedLineH = "";
    let cachedLetterSp = "";

    const syncMirrorStyle = () => {
      const cs = getComputedStyle(bEl);
      if (cs.font !== cachedFont || cs.lineHeight !== cachedLineH || cs.letterSpacing !== cachedLetterSp) {
        cachedFont = cs.font;
        cachedLineH = cs.lineHeight;
        cachedLetterSp = cs.letterSpacing;
        mirror.style.font = cachedFont;
        mirror.style.lineHeight = cachedLineH;
        mirror.style.letterSpacing = cachedLetterSp;
      }
      mirror.style.width = bEl.clientWidth + "px";
    };

    /* ── Follow caret ── */
    const followCaret = (force = false) => {
      if (!sEl || document.activeElement !== bEl) return;
      if (!force && !stick.current) return;

      const margin = 36;
      const vvh = window.visualViewport?.height ?? window.innerHeight;
      const sRect = sEl.getBoundingClientRect();
      const bRect = bEl.getBoundingClientRect();
      const visibleBottom = Math.min(sRect.bottom, vvh);

      let caretBottom: number;
      const atEnd = bEl.selectionEnd >= bEl.value.length;

      if (atEnd) {
        caretBottom = bRect.top + bEl.offsetHeight;
      } else {
        syncMirrorStyle();
        mirror.textContent = bEl.value.substring(0, bEl.selectionEnd) + "\u200b";
        caretBottom = bRect.top + mirror.offsetHeight;
      }

      const lineH = parseFloat(cachedLineH || getComputedStyle(bEl).lineHeight) || 25;
      const caretTop = caretBottom - lineH;

      if (caretBottom > visibleBottom - margin) {
        programmaticScroll = true;
        sEl.scrollTop += caretBottom - visibleBottom + margin;
      } else if (caretTop < sRect.top) {
        programmaticScroll = true;
        sEl.scrollTop -= sRect.top - caretTop;
      }
    };

    const schedFollow = () => {
      cancelAnimationFrame(followRaf);
      followRaf = requestAnimationFrame(() => followCaret(false));
    };

    const onTitle = () => { tv.current = tEl.value; save(); };

    /* ── Resize textarea (single-frame resize + caret follow) ── */
    const onBody = () => {
      const curLen = bEl.value.length;
      const shrunk = curLen < prevLen;
      prevLen = curLen;

      bv.current = bEl.value;
      if (!bEl.value) stick.current = true;
      save();

      requestAnimationFrame(() => {
        // Only reset height when content shrinks; growing needs no reset
        if (shrunk) {
          bEl.style.height = "0";
        }
        bEl.style.height = bEl.scrollHeight + "px";

        const isOverflowing = sEl.scrollHeight > sEl.clientHeight;
        const justOverflowed = !wasOverflowing && isOverflowing;
        wasOverflowing = isOverflowing;

        // Follow caret in the SAME frame (no second rAF)
        followCaret(justOverflowed);
      });
    };

    const onBodyFocus = () => { stick.current = true; schedFollow(); };

    const onSelChange = () => {
      if (document.activeElement === bEl) schedFollow();
    };

    const onContainerScroll = () => {
      if (programmaticScroll) { programmaticScroll = false; return; }
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const gap = sEl.scrollHeight - sEl.scrollTop - sEl.clientHeight;
        stick.current = gap < 60;
      }, 80);
    };

    const vv = window.visualViewport;

    tEl.addEventListener("input", onTitle, { passive: true });
    bEl.addEventListener("input", onBody, { passive: true });
    bEl.addEventListener("compositionend", schedFollow, { passive: true });
    bEl.addEventListener("focus", onBodyFocus, { passive: true });
    document.addEventListener("selectionchange", onSelChange, { passive: true });
    sEl.addEventListener("scroll", onContainerScroll, { passive: true });
    if (vv) vv.addEventListener("resize", schedFollow, { passive: true });

    requestAnimationFrame(() => {
      bEl.style.height = "0";
      bEl.style.height = bEl.scrollHeight + "px";
    });

    if (!initTitle && !initBody) tEl.focus();

    return () => {
      cancelAnimationFrame(followRaf);
      clearTimeout(scrollTimer);
      if (mirror.parentNode) mirror.parentNode.removeChild(mirror);
      tEl.removeEventListener("input", onTitle);
      bEl.removeEventListener("input", onBody);
      bEl.removeEventListener("compositionend", schedFollow);
      bEl.removeEventListener("focus", onBodyFocus);
      document.removeEventListener("selectionchange", onSelChange);
      sEl.removeEventListener("scroll", onContainerScroll);
      if (vv) vv.removeEventListener("resize", schedFollow);
    };
  }, [save, initTitle, initBody]);

  /* ── Flush on visibility change / unload ── */
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", flush);
    };
  }, [flush]);

  const back = useCallback(() => { flush(); onBack(); }, [flush, onBack]);
  useEdgeSwipeBack(back);

  useEffect(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="notes-page notes-push-in"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", touchAction: "pan-y", overscrollBehavior: "none" }}
    >
      <nav
        className="flex items-center justify-between px-1 py-1 notes-nav-bar backdrop-blur-xl"
        style={{ borderBottom: "0.5px solid var(--notes-separator)" }}
      >
        <button onClick={back}
          className="flex items-center gap-0 min-h-[44px] min-w-[44px] px-2 active:opacity-50"
          style={{ color: "var(--color-amber)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[17px] notes-font">メモ</span>
        </button>
        <button onClick={back}
          className="text-[17px] font-medium notes-font min-h-[44px] flex items-center px-4 active:opacity-50"
          style={{ color: "var(--color-amber)" }}>
          完了
        </button>
      </nav>

      <div ref={scrollEl} className="notes-scroll flex-1"
        style={{ overflowY: "auto", overflowX: "hidden", contain: "layout style paint", touchAction: "pan-y", overscrollBehaviorX: "none", overscrollBehaviorY: "auto" }}>
        <div className="px-4 pt-6 pb-40">
          <input ref={titleEl} type="text" defaultValue={initTitle} placeholder="タイトル"
            className="w-full text-[28px] font-bold bg-transparent border-none outline-none notes-font"
            style={{ color: "var(--notes-primary)", caretColor: "var(--color-amber)" }} />
          <textarea ref={bodyEl} defaultValue={initBody} placeholder="メモ"
            className="w-full mt-3 text-[17px] leading-[1.47] bg-transparent border-none outline-none resize-none notes-font"
            style={{ color: "var(--notes-primary)", caretColor: "var(--color-amber)", minHeight: "300px", overflowX: "hidden", wordBreak: "break-word", overflowWrap: "anywhere" }} />
        </div>
      </div>
    </div>
  );
});
