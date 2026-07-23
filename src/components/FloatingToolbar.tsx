import { useState, useEffect, useRef, useCallback } from "react";

interface FloatingToolbarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  onScreenshot?: () => void;
  onToolSelect?: (tool: string | null) => void;
  activeTool?: string | null;
  cameraVisible?: boolean;
  onCameraToggle?: () => void;
  drawColor?: string;
  onColorChange?: (color: string) => void;
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
}

export default function FloatingToolbar({
  isPaused,
  onTogglePause,
  onStop,
  onScreenshot,
  onToolSelect,
  activeTool,
  cameraVisible,
  onCameraToggle,
  drawColor = "#ef4444",
  onColorChange,
  brushSize = 4,
  onBrushSizeChange,
}: FloatingToolbarProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const drawingTools = [
    { id: "pen", icon: "pen", label: "Draw" },
    { id: "highlighter", icon: "highlighter", label: "Highlight" },
    { id: "arrow", icon: "arrow", label: "Arrow" },
    { id: "rectangle", icon: "rectangle", label: "Rectangle" },
    { id: "circle", icon: "circle", label: "Circle" },
    { id: "text", icon: "text", label: "Text" },
  ];

  return (
    <>
      {/* Drawing tools panel */}
      {showDrawingTools && (
        <div
          className="fixed z-50 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-3 shadow-2xl"
          style={{ left: position.x, top: position.y - 60 }}
        >
          <div className="flex items-center gap-1 mb-3">
            {drawingTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  onToolSelect?.(tool.id);
                  setShowDrawingTools(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTool === tool.id
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
          {/* Color picker */}
          <div className="flex items-center gap-2 mb-2">
            {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"].map((c) => (
              <button
                key={c}
                onClick={() => onColorChange?.(c)}
                className={`w-5 h-5 rounded-full border hover:scale-110 transition-transform ${drawColor === c ? "border-white scale-110" : "border-zinc-600"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {/* Brush size */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Size</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => onBrushSizeChange?.(Number(e.target.value))}
              className="flex-1 accent-purple-500 h-1"
            />
            <span className="text-[10px] text-zinc-400">{brushSize}px</span>
          </div>
          {/* Clear button */}
          <button
            onClick={() => onToolSelect?.(null)}
            className="w-full mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Clear Drawings
          </button>
        </div>
      )}

      {/* Main toolbar */}
      <div
        ref={toolbarRef}
        className="fixed z-50 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-1"
        style={{ left: `calc(50% + ${position.x}px)`, top: `calc(50% + ${position.y}px)`, transform: "translate(-50%, -50%)" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* More options */}
        <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Stop */}
        <button
          onClick={onStop}
          className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>

        {/* Pause */}
        <button
          onClick={onTogglePause}
          className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
        >
          {isPaused ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-2">
          {isPaused && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-sm font-mono text-zinc-300 min-w-[48px]">{formatTime(elapsed)}</span>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Mic */}
        <button
          onClick={() => setMicEnabled(!micEnabled)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            micEnabled ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-red-400 bg-red-500/10"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {micEnabled ? (
              <>
                <path d="M12 6a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
              </>
            ) : (
              <>
                <line x1="2" x2="22" y1="2" y2="22" />
                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                <path d="M5 10v2a7 7 0 0 0 12 5" />
                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" x2="12" y1="19" y2="22" />
              </>
            )}
          </svg>
        </button>

        {/* Audio */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            audioEnabled ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-red-400 bg-red-500/10"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {audioEnabled && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
          </svg>
        </button>

        {/* Camera */}
        <button
          onClick={onCameraToggle}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            cameraVisible ? "text-purple-400 bg-purple-500/15" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Drawing tools */}
        <button
          onClick={() => setShowDrawingTools(!showDrawingTools)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            showDrawingTools ? "bg-purple-500/20 text-purple-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>

        {/* Screenshot */}
        <button
          onClick={onScreenshot}
          className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6" /><path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </button>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Settings */}
        <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Minimize */}
        <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        </button>
      </div>
    </>
  );
}
