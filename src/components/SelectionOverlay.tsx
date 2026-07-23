import { useState, useRef, useCallback, useEffect } from "react";

interface SelectionOverlayProps {
  onCapture: (mode: "fullscreen" | "window" | "area", bounds?: { x: number; y: number; w: number; h: number }) => void;
  onCancel: () => void;
}

export default function SelectionOverlay({ onCapture, onCancel }: SelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [showOptions, setShowOptions] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const rect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (showOptions) return;
    setIsDragging(true);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  }, [showOptions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setEnd({ x: e.clientX, y: e.clientY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (rect.w > 10 && rect.h > 10) {
      onCapture("area", { x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    }
  }, [isDragging, rect, onCapture]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ cursor: showOptions ? "default" : "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Selection rectangle */}
      {!showOptions && rect.w > 0 && rect.h > 0 && (
        <>
          <div
            className="absolute border-2 border-blue-500 bg-transparent pointer-events-none"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          />
          {/* Dimension label */}
          <div
            className="absolute px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300 pointer-events-none"
            style={{ left: rect.x + rect.w / 2 - 30, top: rect.y - 28 }}
          >
            {Math.round(rect.w)} x {Math.round(rect.h)}
          </div>
          {/* Corner handles */}
          {[
            { x: rect.x - 4, y: rect.y - 4 },
            { x: rect.x + rect.w - 4, y: rect.y - 4 },
            { x: rect.x - 4, y: rect.y + rect.h - 4 },
            { x: rect.x + rect.w - 4, y: rect.y + rect.h - 4 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 rounded-sm pointer-events-none"
              style={{ left: pos.x, top: pos.y }}
            />
          ))}
        </>
      )}

      {/* Capture options popup */}
      {showOptions && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-2 shadow-2xl">
            <button
              onClick={() => {
                setShowOptions(false);
                onCapture("fullscreen");
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-white/5 text-left transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" /><path d="M12 17v4" />
              </svg>
              <div>
                <p className="text-sm font-medium">Full Screen</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowOptions(false);
                onCapture("window");
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-white/5 text-left transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
              <div>
                <p className="text-sm font-medium">Window</p>
              </div>
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-purple-500/15 text-left transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
              <div>
                <p className="text-sm font-medium text-purple-400">Custom Area</p>
              </div>
            </button>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-3">ESC to cancel</p>
        </div>
      )}

      {/* ESC hint when dragging */}
      {!showOptions && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <span className="px-2 py-1 bg-zinc-800/80 border border-zinc-700 rounded text-xs text-zinc-400">ESC</span>
          <span className="text-xs text-zinc-500">Cancel</span>
        </div>
      )}
    </div>
  );
}
