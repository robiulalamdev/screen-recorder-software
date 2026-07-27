import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useSettings } from "../stores/settingsStore";

type SizeMode = "fullscreen" | "customize" | "3:4" | "4:3" | "9:16" | "16:9";

const SIZE_MODES: { id: SizeMode; label: string }[] = [
  { id: "fullscreen", label: "Full Screen" },
  { id: "customize", label: "Customize" },
  { id: "3:4", label: "3:4" },
  { id: "4:3", label: "4:3" },
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
];

const FPS_OPTIONS: number[] = [15, 20, 24, 30, 60];

function getRatio(mode: SizeMode): number | null {
  switch (mode) {
    case "3:4": return 3 / 4;
    case "4:3": return 4 / 3;
    case "9:16": return 9 / 16;
    case "16:9": return 16 / 9;
    default: return null;
  }
}

function calcCenteredRect(w: number, h: number, ratio: number) {
  let rw = w * 0.7;
  let rh = rw / ratio;
  if (rh > h * 0.7) {
    rh = h * 0.7;
    rw = rh * ratio;
  }
  return {
    x: (w - rw) / 2,
    y: (h - rh) / 2,
    w: rw,
    h: rh,
  };
}

type ResizeEdge = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";

export default function OverlayWindow() {
  const { settings, updateSettings } = useSettings();
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [sizeMode, setSizeMode] = useState<SizeMode>("customize");
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showFpsDropdown, setShowFpsDropdown] = useState(false);
  const [fps, setFps] = useState<number>(settings.frameRate);
  const [micEnabled, setMicEnabled] = useState(true);
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const resizeStartRef = useRef({ mx: 0, my: 0, rx: 0, ry: 0, rw: 0, rh: 0 });
  const moveOffsetRef = useRef({ ox: 0, oy: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const ratio = getRatio(sizeMode);

  const rect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };

  useEffect(() => {
    invoke<string>("capture_screen").then((path) => {
      setScreenshotUrl(convertFileSrc(path));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "overlay-toolbar-no-drag";
    style.innerHTML = `
      [data-toolbar-interactive],
      [data-toolbar-handle],
      [data-toolbar-interactive] svg,
      [data-toolbar-interactive] button {
        -webkit-app-region: no-drag !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const stopToolbarEvents = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // Mouse handlers for custom area selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-toolbar]") || target.closest("[data-resize-handle]")) return;
    if (sizeMode !== "customize") return;
    // Don't start new selection when clicking inside existing selection
    if (hasSelection) {
      const x = e.clientX;
      const y = e.clientY;
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return;
    }
    setIsDragging(true);
    setHasSelection(false);
    const x = e.clientX;
    const y = e.clientY;
    setStart({ x, y });
    setEnd({ x, y });
    dragStartRef.current = { x, y };
  }, [sizeMode, hasSelection, rect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && sizeMode === "customize") {
      setEnd({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, sizeMode]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && sizeMode === "customize") {
      setIsDragging(false);
      if (rect.w > 30 && rect.h > 30) {
        setHasSelection(true);
      }
    }
  }, [isDragging, sizeMode, rect]);

  // Resize handlers
  const handleResizeStart = useCallback((edge: ResizeEdge, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeEdge(edge);
    resizeStartRef.current = {
      mx: e.clientX,
      my: e.clientY,
      rx: rect.x,
      ry: rect.y,
      rw: rect.w,
      rh: rect.h,
    };
  }, [rect]);

  useEffect(() => {
    if (!resizeEdge) return;

    const handlePointerMove = (e: PointerEvent) => {
      const { mx, my, rx, ry, rw, rh } = resizeStartRef.current;
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      let nx = rx, ny = ry, nw = rw, nh = rh;

      const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

      switch (resizeEdge) {
        case "tl":
          nx = rx + dx; ny = ry + dy; nw = rw - dx; nh = rh - dy;
          if (ratio) { nh = nw / ratio; ny = ry + rh - nh; }
          break;
        case "tr":
          ny = ry + dy; nw = rw + dx; nh = rh - dy;
          if (ratio) { nh = nw / ratio; ny = ry + rh - nh; }
          break;
        case "bl":
          nx = rx + dx; nw = rw - dx; nh = rh + dy;
          if (ratio) { nh = nw / ratio; }
          break;
        case "br":
          nw = rw + dx; nh = rh + dy;
          if (ratio) { nh = nw / ratio; }
          break;
        case "t":
          ny = ry + dy; nh = rh - dy;
          if (ratio) { nw = nh * ratio; nx = rx + (rw - nw) / 2; }
          break;
        case "b":
          nh = rh + dy;
          if (ratio) { nw = nh * ratio; nx = rx + (rw - nw) / 2; }
          break;
        case "l":
          nx = rx + dx; nw = rw - dx;
          if (ratio) { nh = nw / ratio; ny = ry + (rh - nh) / 2; }
          break;
        case "r":
          nw = rw + dx;
          if (ratio) { nh = nw / ratio; ny = ry + (rh - nh) / 2; }
          break;
      }

      if (nw < 50) nw = 50;
      if (nh < 50) nh = 50;

      nx = clamp(nx, 0, screenW - nw);
      ny = clamp(ny, 0, screenH - nh);

      setStart({ x: nx, y: ny });
      setEnd({ x: nx + nw, y: ny + nh });
      setHasSelection(true);
    };

    const handlePointerUp = () => setResizeEdge(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeEdge, ratio, screenW, screenH]);

  // Move (drag selection area)
  const handleMoveStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMoving(true);
    moveOffsetRef.current = { ox: e.clientX - rect.x, oy: e.clientY - rect.y };
  }, [rect]);

  useEffect(() => {
    if (!isMoving) return;
    const handlePointerMove = (e: PointerEvent) => {
      const { ox, oy } = moveOffsetRef.current;
      let nx = e.clientX - ox;
      let ny = e.clientY - oy;
      nx = Math.min(Math.max(nx, 0), screenW - rect.w);
      ny = Math.min(Math.max(ny, 0), screenH - rect.h);
      const nw = rect.w;
      const nh = rect.h;
      setStart({ x: nx, y: ny });
      setEnd({ x: nx + nw, y: ny + nh });
    };
    const handlePointerUp = () => setIsMoving(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isMoving, screenW, screenH, rect.w, rect.h]);

  const handleRecord = useCallback(async () => {
    if (!hasSelection) return;
    try {
      await invoke("start_recording_from_overlay", {
        x: rect.x, y: rect.y, w: rect.w, h: rect.h,
      });
      await invoke("close_selection_overlay");
    } catch (err) {
      console.error(err);
      await invoke("close_selection_overlay");
    }
  }, [hasSelection, rect]);

  const handleCancel = useCallback(async () => {
    try {
      await invoke("close_selection_overlay");
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  const handleSizeSelect = useCallback((mode: SizeMode) => {
    setShowSizeDropdown(false);
    setSizeMode(mode);
    if (mode === "fullscreen") {
      setStart({ x: 0, y: 0 });
      setEnd({ x: screenW, y: screenH });
      setHasSelection(true);
      return;
    }
    if (mode === "customize") {
      setHasSelection(false);
      setStart({ x: 0, y: 0 });
      setEnd({ x: 0, y: 0 });
      return;
    }
    const r = getRatio(mode);
    if (r) {
      const centered = calcCenteredRect(screenW, screenH, r);
      setStart({ x: centered.x, y: centered.y });
      setEnd({ x: centered.x + centered.w, y: centered.y + centered.h });
      setHasSelection(true);
    }
  }, [screenW, screenH]);

  const handleFpsSelect = useCallback((v: number) => {
    setShowFpsDropdown(false);
    setFps(v);
    updateSettings({ frameRate: v as 24 | 30 | 60 });
  }, [updateSettings]);

  const handleMicToggle = useCallback(() => {
    const next = !micEnabled;
    setMicEnabled(next);
  }, [micEnabled]);

  const handleAudioToggle = useCallback(() => {
    const next = !systemAudioEnabled;
    setSystemAudioEnabled(next);
  }, [systemAudioEnabled]);

  const resizeHandles: { edge: ResizeEdge; cursor: string; style: React.CSSProperties }[] = [
    { edge: "tl", cursor: "nwse-resize", style: { left: -5, top: -5 } },
    { edge: "tr", cursor: "nesw-resize", style: { right: -5, top: -5 } },
    { edge: "bl", cursor: "nesw-resize", style: { left: -5, bottom: -5 } },
    { edge: "br", cursor: "nwse-resize", style: { right: -5, bottom: -5 } },
    { edge: "t", cursor: "ns-resize", style: { left: "50%", top: -5, transform: "translateX(-50%)" } },
    { edge: "b", cursor: "ns-resize", style: { left: "50%", bottom: -5, transform: "translateX(-50%)" } },
    { edge: "l", cursor: "ew-resize", style: { top: "50%", left: -5, transform: "translateY(-50%)" } },
    { edge: "r", cursor: "ew-resize", style: { top: "50%", right: -5, transform: "translateY(-50%)" } },
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        cursor: sizeMode === "customize" ? "crosshair" : "default",
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {screenshotUrl ? (
        <img
          src={screenshotUrl}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
          alt=""
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#1a1a2e" }} />
      )}

      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", pointerEvents: "none" }} />

      {(hasSelection || isDragging) && rect.w > 0 && rect.h > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              background: "transparent",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              border: "2px solid #3b82f6",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: rect.x + rect.w / 2 - 40,
              top: rect.y - 30,
              padding: "4px 10px",
              backgroundColor: "rgba(0,0,0,0.7)",
              borderRadius: "6px",
              color: "white",
              fontSize: "12px",
              fontFamily: "monospace",
              pointerEvents: "none",
            }}
          >
            {Math.round(rect.w)} x {Math.round(rect.h)}
          </div>
          {/* Corner + edge midpoint resize handles */}
          {resizeHandles.map((h) => (
            <div
              key={h.edge}
              data-resize-handle={h.edge}
              onPointerDown={(e) => handleResizeStart(h.edge, e)}
              style={{
                position: "absolute",
                width: 10, height: 10,
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                borderRadius: "50%",
                cursor: h.cursor,
                zIndex: 22,
                ...h.style,
              }}
            />
          ))}
          {/* Edge hit strips (wider invisible areas for easy grabbing) */}
          <div data-resize-handle="t" onPointerDown={(e) => handleResizeStart("t", e)} style={{ position: "absolute", left: rect.x, top: rect.y - 5, width: rect.w, height: 10, cursor: "ns-resize", zIndex: 21, opacity: 0 }} />
          <div data-resize-handle="b" onPointerDown={(e) => handleResizeStart("b", e)} style={{ position: "absolute", left: rect.x, top: rect.y + rect.h - 5, width: rect.w, height: 10, cursor: "ns-resize", zIndex: 21, opacity: 0 }} />
          <div data-resize-handle="l" onPointerDown={(e) => handleResizeStart("l", e)} style={{ position: "absolute", left: rect.x - 5, top: rect.y, width: 10, height: rect.h, cursor: "ew-resize", zIndex: 21, opacity: 0 }} />
          <div data-resize-handle="r" onPointerDown={(e) => handleResizeStart("r", e)} style={{ position: "absolute", left: rect.x + rect.w - 5, top: rect.y, width: 10, height: rect.h, cursor: "ew-resize", zIndex: 21, opacity: 0 }} />
          {/* Move overlay — drag to reposition the selection */}
          <div
            onPointerDown={handleMoveStart}
            style={{
              position: "absolute",
              left: rect.x, top: rect.y,
              width: rect.w, height: rect.h,
              cursor: "move",
              zIndex: 18,
            }}
          />
        </>
      )}

      {/* Top-center toolbar */}
      <div
        data-toolbar="true"
        style={{
          position: "absolute",
          left: "50%",
          top: 20,
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          backgroundColor: "#1a1a2e",
          borderRadius: "12px",
          border: "1px solid #2a2a3e",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 10,
          userSelect: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Size dropdown */}
        <div style={{ position: "relative" }}>
          <button
            data-toolbar-interactive="true"
            onPointerDown={stopToolbarEvents}
            onClick={(e) => { stopToolbarEvents(e); setShowSizeDropdown((v) => !v); setShowFpsDropdown(false); }}
            style={{
              padding: "6px 10px", borderRadius: "8px",
              backgroundColor: showSizeDropdown ? "#2a2a3e" : "transparent",
              border: "none", color: "#e4e4e7", fontSize: "12px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" /><path d="M9 21V9" />
            </svg>
            {SIZE_MODES.find((m) => m.id === sizeMode)?.label || "Customize"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showSizeDropdown && (
            <div
              style={{
                position: "absolute", top: "100%", left: "50%",
                transform: "translateX(-50%)", marginTop: 4,
                backgroundColor: "#1a1a2e", border: "1px solid #2a2a3e",
                borderRadius: "10px", padding: "4px", minWidth: 140,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100,
              }}
            >
              {SIZE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  data-toolbar-interactive="true"
                  onPointerDown={stopToolbarEvents}
                  onClick={(e) => { stopToolbarEvents(e); handleSizeSelect(mode.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: "none", background: mode.id === sizeMode ? "#2a2a3e" : "transparent",
                    color: mode.id === sizeMode ? "#fff" : "#a1a1aa",
                    fontSize: "12px", cursor: "pointer", textAlign: "left",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

        {/* FPS dropdown */}
        <div style={{ position: "relative" }}>
          <button
            data-toolbar-interactive="true"
            onPointerDown={stopToolbarEvents}
            onClick={(e) => { stopToolbarEvents(e); setShowFpsDropdown((v) => !v); setShowSizeDropdown(false); }}
            style={{
              padding: "6px 10px", borderRadius: "8px",
              backgroundColor: showFpsDropdown ? "#2a2a3e" : "transparent",
              border: "none", color: "#e4e4e7", fontSize: "12px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
              fontFamily: "monospace",
            }}
          >
            {fps} FPS
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showFpsDropdown && (
            <div
              style={{
                position: "absolute", top: "100%", left: "50%",
                transform: "translateX(-50%)", marginTop: 4,
                backgroundColor: "#1a1a2e", border: "1px solid #2a2a3e",
                borderRadius: "10px", padding: "4px", minWidth: 80,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100,
              }}
            >
              {FPS_OPTIONS.map((v) => (
                <button
                  key={v}
                  data-toolbar-interactive="true"
                  onPointerDown={stopToolbarEvents}
                  onClick={(e) => { stopToolbarEvents(e); handleFpsSelect(v); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: "none", background: v === fps ? "#2a2a3e" : "transparent",
                    color: v === fps ? "#fff" : "#a1a1aa",
                    fontSize: "12px", cursor: "pointer", fontFamily: "monospace",
                  }}
                >
                  {v} FPS
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

        {/* Mic toggle */}
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handleMicToggle(); }}
          style={{
            width: "32px", height: "32px", borderRadius: "8px",
            backgroundColor: "transparent", border: "none",
            color: micEnabled ? "#e4e4e7" : "#52525b",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center",
          }}
          title={micEnabled ? "Microphone On" : "Microphone Off"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
            {!micEnabled && <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" />}
          </svg>
        </button>

        {/* System audio toggle */}
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handleAudioToggle(); }}
          style={{
            width: "32px", height: "32px", borderRadius: "8px",
            backgroundColor: "transparent", border: "none",
            color: systemAudioEnabled ? "#e4e4e7" : "#52525b",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center",
          }}
          title={systemAudioEnabled ? "System Audio On" : "System Audio Off"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            {!systemAudioEnabled && <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" />}
          </svg>
        </button>

        <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handleCancel(); }}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", borderRadius: "8px",
            backgroundColor: "transparent", border: "none",
            color: "#a1a1aa", fontSize: "12px", cursor: "pointer",
          }}
        >
          <span style={{ padding: "2px 6px", backgroundColor: "#333", borderRadius: "4px", fontSize: "10px", fontFamily: "monospace" }}>ESC</span>
          Cancel
        </button>

        <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); if (hasSelection || sizeMode === "fullscreen") handleRecord(); }}
          disabled={!hasSelection}
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: hasSelection ? "#ef4444" : "#444",
            border: "none", cursor: hasSelection ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Start Recording"
        >
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "white" }} />
        </button>
      </div>
    </div>
  );
}
