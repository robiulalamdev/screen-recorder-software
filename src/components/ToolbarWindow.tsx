import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { useSettings } from "../stores/settingsStore";

export default function ToolbarWindow() {
  const { settings } = useSettings();
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [isRecordingPhase, setIsRecordingPhase] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const unlisten = listen("recording-started", () => setIsRecordingPhase(true));
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "recording-toolbar-no-drag";
    style.innerHTML = `
      [data-toolbar-interactive],
      [data-toolbar-handle],
      [data-toolbar-interactive] svg {
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
    const maxX = Math.max(0, window.innerWidth - 650);
    const maxY = Math.max(0, window.innerHeight - 56);
    toolbarDragOffsetRef.current = {
      x: e.clientX - toolbarPosition.x,
      y: e.clientY - toolbarPosition.y,
    };
    setToolbarPosition((pos) => ({
      x: Math.min(Math.max(pos.x, 0), maxX),
      y: Math.min(Math.max(pos.y, 0), maxY),
    }));
  }, [stopToolbarEvents, toolbarPosition.x, toolbarPosition.y]);

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handlePointerMove = (e: PointerEvent) => {
      const maxX = Math.max(0, window.innerWidth - 650);
      const maxY = Math.max(0, window.innerHeight - 56);
      setToolbarPosition({
        x: Math.min(Math.max(e.clientX - toolbarDragOffsetRef.current.x, 0), maxX),
        y: Math.min(Math.max(e.clientY - toolbarDragOffsetRef.current.y, 0), maxY),
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

  // Listen for pause/resume from main window
  useEffect(() => {
    const unlisten = listen("toolbar-toggle-pause", () => {
      setIsPaused((p) => !p);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleStop = async () => {
    try { await emit("tray-stop-recording"); } catch (e) {
        console.error(e);
        // Fallback
        invoke("stop_recording");
        invoke("close_toolbar_window");
    }
  };

  const handleStart = async () => {
    try { await emit("tray-start-recording"); } catch {}
  };

  const handlePause = async () => {
    const willPause = !isPaused;
    setIsPaused(willPause);
    try { await invoke(willPause ? "pause_recording" : "resume_recording"); } catch {}
    try { await emit("recording-toggle-pause"); } catch {}
  };

  const toggleDrawing = async () => {
    const newMode = !drawingMode;
    setDrawingMode(newMode);
    try { await invoke("toggle_drawing_mode", { enabled: newMode }); } catch {}
  };

  const clearDrawing = () => {
    emit("clear-drawing");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#1a1a2e",
        borderBottom: "1px solid #2a2a3e",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: toolbarPosition.x,
          top: toolbarPosition.y,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "0 16px",
          height: "56px",
        }}
      >
      {/* Drag Handle */}
      <div
        data-toolbar-handle="true"
        onPointerDown={handleToolbarPointerDown}
        style={{
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          padding: "4px",
          marginLeft: "-8px",
          marginRight: "4px",
        }}
      >
        <svg width="12" height="20" viewBox="0 0 12 20" fill="#a1a1aa">
            <circle cx="4" cy="5" r="1.5"/><circle cx="4" cy="10" r="1.5"/><circle cx="4" cy="15" r="1.5"/>
            <circle cx="8" cy="5" r="1.5"/><circle cx="8" cy="10" r="1.5"/><circle cx="8" cy="15" r="1.5"/>
        </svg>
      </div>
      
      {/* Start / Stop */}
      {!isRecordingPhase ? (
        <button
         data-toolbar-interactive="true"
         onPointerDown={stopToolbarEvents}
         onMouseDown={stopToolbarEvents}
         onClick={(e) => { stopToolbarEvents(e); handleStart(); }}
         style={{
           width: "36px", height: "36px", borderRadius: "50%",
           backgroundColor: "#22c55e", border: "none", cursor: "pointer",
           display: "flex", alignItems: "center", justifyContent: "center",
         }}
         title="Start Recording"
       >
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "white" }} />
        </button>
      ) : (
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handleStop(); }}
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: "#ef4444", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Stop Recording"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}

      {/* Pause (only visible during recording) */}
      {isRecordingPhase && (
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); handlePause(); }}
          style={{
            width: "32px", height: "32px", borderRadius: "8px",
            backgroundColor: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#a1a1aa",
          }}
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
      )}

      {/* Divider */}
      <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

      {/* Timer */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {isPaused && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }} />}
        <span style={{ fontSize: "13px", fontFamily: "monospace", color: "#d4d4d8", minWidth: "40px" }}>
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

      {/* Mic */}
      <button
        data-toolbar-interactive="true"
        onPointerDown={stopToolbarEvents}
        onMouseDown={stopToolbarEvents}
        onClick={(e) => { stopToolbarEvents(e); setMicEnabled(!micEnabled); }}
        style={{
          width: "32px", height: "32px", borderRadius: "8px",
          backgroundColor: micEnabled ? "transparent" : "rgba(239,68,68,0.1)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: micEnabled ? "#a1a1aa" : "#f87171",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 6a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>

      {/* Audio */}
      <button
        data-toolbar-interactive="true"
        onPointerDown={stopToolbarEvents}
        onMouseDown={stopToolbarEvents}
        onClick={(e) => { stopToolbarEvents(e); setAudioEnabled(!audioEnabled); }}
        style={{
          width: "32px", height: "32px", borderRadius: "8px",
          backgroundColor: audioEnabled ? "transparent" : "rgba(239,68,68,0.1)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: audioEnabled ? "#a1a1aa" : "#f87171",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {audioEnabled && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
        </svg>
      </button>

      {/* Camera */}
      <button
        data-toolbar-interactive="true"
        onPointerDown={stopToolbarEvents}
        onMouseDown={stopToolbarEvents}
        onClick={(e) => { stopToolbarEvents(e); setCameraVisible(!cameraVisible); }}
        style={{
          width: "32px", height: "32px", borderRadius: "8px",
          backgroundColor: cameraVisible ? "rgba(139,92,246,0.15)" : "transparent",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: cameraVisible ? "#c084fc" : "#a1a1aa",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

      {/* Pen */}
      <button
        data-toolbar-interactive="true"
        onPointerDown={stopToolbarEvents}
        onMouseDown={stopToolbarEvents}
        onClick={(e) => { stopToolbarEvents(e); toggleDrawing(); }}
        style={{
          width: "32px", height: "32px", borderRadius: "8px",
          backgroundColor: drawingMode ? "rgba(59,130,246,0.15)" : "transparent",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: drawingMode ? "#3b82f6" : "#a1a1aa",
        }}
        title="Toggle Drawing"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      </button>

      {/* Clear Drawing */}
      {drawingMode && (
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => { stopToolbarEvents(e); clearDrawing(); }}
          style={{
            width: "32px", height: "32px", borderRadius: "8px",
            backgroundColor: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171",
          }}
          title="Clear Drawing"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}

      {/* Divider */}
      <div style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }} />

      {/* Screenshot */}
      <button
        data-toolbar-interactive="true"
        onPointerDown={stopToolbarEvents}
        onMouseDown={stopToolbarEvents}
        onClick={async (e) => { stopToolbarEvents(e); try { await invoke("take_screenshot", { saveLocation: settings.saveLocation }); } catch {} }}
        style={{
          width: "32px", height: "32px", borderRadius: "8px",
          backgroundColor: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h6v6" /><path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      </button>
      </div>
    </div>
  );
}
