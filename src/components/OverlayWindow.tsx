import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function OverlayWindow() {
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 24 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragOffsetRef = useRef({ x: 0, y: 0 });

  const rect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };

  // Load screenshot
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

  const handleToolbarPointerDown = useCallback((e: React.PointerEvent) => {
    stopToolbarEvents(e);
    setIsDraggingToolbar(true);
    const maxX = Math.max(8, window.innerWidth - 280);
    const maxY = Math.max(8, window.innerHeight - 64);
    toolbarDragOffsetRef.current = {
      x: e.clientX - toolbarPosition.x,
      y: e.clientY - toolbarPosition.y,
    };
    setToolbarPosition((pos) => ({
      x: Math.min(Math.max(pos.x, 8), maxX),
      y: Math.min(Math.max(pos.y, 8), maxY),
    }));
  }, [stopToolbarEvents, toolbarPosition.x, toolbarPosition.y]);

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handlePointerMove = (e: PointerEvent) => {
      const maxX = Math.max(8, window.innerWidth - 280);
      const maxY = Math.max(8, window.innerHeight - 64);
      setToolbarPosition({
        x: Math.min(Math.max(e.clientX - toolbarDragOffsetRef.current.x, 8), maxX),
        y: Math.min(Math.max(e.clientY - toolbarDragOffsetRef.current.y, 8), maxY),
      });
    };

    const handlePointerUp = () => setIsDraggingToolbar(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingToolbar]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setHasSelection(false);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setEnd({ x: e.clientX, y: e.clientY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (rect.w > 30 && rect.h > 30) {
      setHasSelection(true);
    }
  }, [isDragging, rect]);

  const handleRecord = useCallback(async () => {
    if (!hasSelection) return;
    // Close overlay, show main window, start countdown
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

  const handleFullscreen = useCallback(async () => {
    try {
      await invoke("start_recording_from_overlay", {
        x: 0, y: 0, w: 0, h: 0,
      });
      await invoke("close_selection_overlay");
    } catch (err) {
      console.error(err);
    }
  }, []);

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

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        cursor: "crosshair",
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Screenshot background */}
      {screenshotUrl ? (
        <img
          src={screenshotUrl}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
          alt=""
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#1a1a2e" }} />
      )}

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", pointerEvents: "none" }} />

      {/* Selection rectangle with cutout */}
      {rect.w > 0 && rect.h > 0 && (
        <>
          {/* Cutout — clear area inside selection */}
          <div
            style={{
              position: "absolute",
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              background: "transparent",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          />
          {/* Blue border */}
          <div
            style={{
              position: "absolute",
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              border: "2px solid #3b82f6",
              pointerEvents: "none",
            }}
          />
          {/* Size label */}
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
          {/* Corner handles */}
          {[
            { x: rect.x - 5, y: rect.y - 5 },
            { x: rect.x + rect.w - 5, y: rect.y - 5 },
            { x: rect.x - 5, y: rect.y + rect.h - 5 },
            { x: rect.x + rect.w - 5, y: rect.y + rect.h - 5 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.x, top: pos.y,
                width: "10px", height: "10px",
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                pointerEvents: "none",
              }}
            />
          ))}
        </>
      )}

      {/* Top toolbar */}
      <div
        style={{
          position: "absolute",
          left: toolbarPosition.x,
          top: toolbarPosition.y,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#1a1a2e",
          borderRadius: "12px",
          border: "1px solid #2a2a3e",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 10,
          userSelect: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          data-toolbar-handle="true"
          onPointerDown={handleToolbarPointerDown}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "24px",
            cursor: "grab",
            color: "#71717a",
            flexShrink: 0,
          }}
          title="Drag toolbar"
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
            <circle cx="4" cy="5" r="1.5" />
            <circle cx="4" cy="10" r="1.5" />
            <circle cx="4" cy="15" r="1.5" />
            <circle cx="8" cy="5" r="1.5" />
            <circle cx="8" cy="10" r="1.5" />
            <circle cx="8" cy="15" r="1.5" />
          </svg>
        </div>
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
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
          onMouseDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handleFullscreen(); }}
          style={{
            padding: "6px 12px", borderRadius: "8px",
            backgroundColor: "transparent", border: "none",
            color: "#a1a1aa", fontSize: "12px", cursor: "pointer",
          }}
        >
          Full Screen
        </button>

        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handleRecord(); }}
          disabled={!hasSelection}
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: hasSelection ? "#ef4444" : "#444",
            border: "none", cursor: hasSelection ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "white" }} />
        </button>
      </div>
    </div>
  );
}
