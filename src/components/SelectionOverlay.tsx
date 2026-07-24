import { useState, useCallback, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

interface SelectionOverlayProps {
  screenshotPath: string | null;
  onCapture: (mode: "fullscreen" | "window" | "area", bounds?: { x: number; y: number; w: number; h: number }) => void;
  onCancel: () => void;
}

export default function SelectionOverlay({ screenshotPath, onCapture, onCancel }: SelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [showCaptureMenu, setShowCaptureMenu] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  const rect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };

  const screenshotUrl = screenshotPath ? convertFileSrc(screenshotPath) : null;

  const handleOverlayMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-toolbar]")) return;
    if (showCaptureMenu) { setShowCaptureMenu(false); return; }
    setIsDragging(true);
    setHasSelection(false);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  }, [showCaptureMenu]);

  const handleOverlayMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setEnd({ x: e.clientX, y: e.clientY });
  }, [isDragging]);

  const handleOverlayMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (rect.w > 50 && rect.h > 50) {
      setHasSelection(true);
    }
  }, [isDragging, rect]);

  const handleStartRecording = useCallback(() => {
    if (hasSelection) {
      onCapture("area", { x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    }
  }, [hasSelection, rect, onCapture]);

  const handleModeSelect = useCallback((mode: "fullscreen" | "window" | "area") => {
    setShowCaptureMenu(false);
    if (mode === "area") {
      setHasSelection(false);
      setStart({ x: 0, y: 0 });
      setEnd({ x: 0, y: 0 });
    } else {
      onCapture(mode);
    }
  }, [onCapture]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ cursor: "crosshair" }}
      onMouseDown={handleOverlayMouseDown}
      onMouseMove={handleOverlayMouseMove}
      onMouseUp={handleOverlayMouseUp}
    >
      {/* Screenshot background */}
      {screenshotUrl ? (
        <img
          src={screenshotUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          alt=""
        />
      ) : (
        <div className="absolute inset-0 bg-bg-primary" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Selection rectangle */}
      {rect.w > 0 && rect.h > 0 && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              background: "transparent",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              border: "2px solid #3b82f6",
            }}
          />
          <div
            className="absolute px-2.5 py-1 bg-zinc-900/90 border border-zinc-600 rounded text-xs text-white font-mono pointer-events-none"
            style={{ left: rect.x + rect.w / 2 - 36, top: rect.y - 32 }}
          >
            {Math.round(rect.w)} x {Math.round(rect.h)}
          </div>
          {[
            { x: rect.x - 5, y: rect.y - 5 },
            { x: rect.x + rect.w - 5, y: rect.y - 5 },
            { x: rect.x - 5, y: rect.y + rect.h - 5 },
            { x: rect.x + rect.w - 5, y: rect.y + rect.h - 5 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full pointer-events-none"
              style={{ left: pos.x, top: pos.y }}
            />
          ))}
        </>
      )}

      {/* Floating Toolbar */}
      <div
        data-toolbar="true"
        className="fixed z-[10000] pointer-events-auto"
        style={{ left: "50%", top: 20, transform: "translateX(-50%)" }}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="bg-bg-elevated/95 backdrop-blur-sm border border-border-secondary rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <span className="px-1.5 py-0.5 bg-bg-primary border border-border-primary rounded text-[10px] font-mono text-text-secondary">ESC</span>
            Cancel
          </button>

          <div className="w-px h-6 bg-border-primary mx-1" />

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCaptureMenu(!showCaptureMenu); }}
              className="w-8 h-8 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showCaptureMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-bg-elevated border border-border-secondary rounded-xl p-1.5 shadow-2xl min-w-[160px]" data-menu="true">
                <button onClick={(e) => { e.stopPropagation(); handleModeSelect("fullscreen"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
                  </svg>
                  Full Screen
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleModeSelect("window"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                  </svg>
                  Window
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleModeSelect("area"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm bg-accent-bg text-accent-text transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  </svg>
                  Custom Area
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border-primary mx-1" />

          <button
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); if (hasSelection) handleStartRecording(); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              hasSelection ? "bg-red-500 hover:bg-red-600" : "bg-zinc-700 cursor-not-allowed"
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
