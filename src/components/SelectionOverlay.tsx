import { useState, useCallback, useEffect, useRef } from "react";

interface SelectionOverlayProps {
  onCapture: (mode: "fullscreen" | "window" | "area", bounds?: { x: number; y: number; w: number; h: number }) => void;
  onCancel: () => void;
}

export default function SelectionOverlay({ onCapture, onCancel }: SelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [showCaptureMenu, setShowCaptureMenu] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 40 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragStart = useRef({ x: 0, y: 0 });
  const toolbarPosStart = useRef({ x: 0, y: 0 });

  const rect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };

  // Initialize toolbar position to center top
  useEffect(() => {
    setToolbarPos({ x: window.innerWidth / 2 - 325, y: 40 });
  }, []);

  // Handle toolbar dragging
  const handleToolbarMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingToolbar(true);
    toolbarDragStart.current = { x: e.clientX, y: e.clientY };
    toolbarPosStart.current = { ...toolbarPos };
  }, [toolbarPos]);

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - toolbarDragStart.current.x;
      const dy = e.clientY - toolbarDragStart.current.y;
      setToolbarPos({
        x: Math.max(0, Math.min(window.innerWidth - 650, toolbarPosStart.current.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, toolbarPosStart.current.y + dy)),
      });
    };

    const handleMouseUp = () => setIsDraggingToolbar(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingToolbar]);

  // Handle selection dragging
  const handleOverlayMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start selection if clicking on toolbar
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
      className="fixed inset-0 z-[9999]"
      style={{ cursor: "crosshair", background: "rgba(0, 0, 0, 0.5)" }}
      onMouseDown={handleOverlayMouseDown}
      onMouseMove={handleOverlayMouseMove}
      onMouseUp={handleOverlayMouseUp}
    >
      {/* Selection rectangle */}
      {rect.w > 0 && rect.h > 0 && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              background: "transparent",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              border: "2px dashed #3b82f6",
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

      {/* Floating Toolbar - TOP, draggable */}
      <div
        data-toolbar="true"
        className="fixed z-[10000] pointer-events-auto"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="bg-[#1a1a2e]/95 backdrop-blur-sm border border-[#2a2a3e] rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-1 cursor-move"
          onMouseDown={handleToolbarMouseDown}
        >
          {/* ESC Cancel */}
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] font-mono">ESC</span>
            Cancel
          </button>

          <div className="w-px h-6 bg-zinc-700 mx-1" />

          {/* Capture mode selector */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCaptureMenu(!showCaptureMenu); }}
              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {showCaptureMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-1.5 shadow-2xl min-w-[160px]" data-menu="true">
                <button onClick={(e) => { e.stopPropagation(); handleModeSelect("fullscreen"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" /><path d="M12 17v4" />
                  </svg>
                  Full Screen
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleModeSelect("window"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" /><path d="M9 21V9" />
                  </svg>
                  Window
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleModeSelect("area"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm bg-purple-500/15 text-purple-400 transition-colors cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  </svg>
                  Custom Area
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-zinc-700 mx-1" />

          {/* Record button */}
          <button
            onClick={(e) => { e.stopPropagation(); if (hasSelection) handleStartRecording(); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              hasSelection ? "bg-red-500 hover:bg-red-600" : "bg-zinc-700 cursor-not-allowed"
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white" />
          </button>

          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 cursor-not-allowed" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>

          <div className="w-px h-6 bg-zinc-700 mx-1" />
          <span className="text-sm font-mono text-zinc-500 min-w-[48px]">00:00:00</span>
          <div className="w-px h-6 bg-zinc-700 mx-1" />

          {/* Mic */}
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          {/* Volume */}
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>

          {/* Camera */}
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </button>

          <div className="w-px h-6 bg-zinc-700 mx-1" />

          {/* Drawing tools */}
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>

          <div className="w-px h-6 bg-zinc-700 mx-1" />

          {/* Settings */}
          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
