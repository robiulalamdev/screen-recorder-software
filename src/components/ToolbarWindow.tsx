import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalSize, PhysicalPosition } from "@tauri-apps/api/window";
import { useSettings } from "../stores/settingsStore";

export default function ToolbarWindow() {
  const { settings } = useSettings();
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(settings.microphone !== "muted");
  const [audioEnabled, setAudioEnabled] = useState(settings.systemAudio !== "muted");
  const [drawingMode, setDrawingMode] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [penColor, setPenColor] = useState("#ef4444");
  const [penSize, setPenSize] = useState(4);
  const [eraserMode, setEraserMode] = useState(false);
  const [isRecordingPhase, setIsRecordingPhase] = useState(true);

  const captureScreenshot = useCallback(async () => {
    const win = getCurrentWindow();
    let savedPos;
    try {
      savedPos = await win.outerPosition();
      await win.setPosition(new PhysicalPosition(-2000, -2000));
      await new Promise((r) => setTimeout(r, 100));
      const path = await invoke<string>("take_screenshot", {
        saveLocation: settings.saveLocation,
      });
      if (savedPos) await win.setPosition(savedPos);
      try {
        await invoke("open_file", { path });
      } catch {}
      try {
        const sizeBytes = await invoke<number>("get_file_size", { path });
        const size = sizeBytes > 1048576 ? `${(sizeBytes / 1048576).toFixed(1)} MB` : `${(sizeBytes / 1024).toFixed(1)} KB`;
        const name = path.split("/").pop() || "Screenshot.png";
        const recordings = JSON.parse(localStorage.getItem("screen-recorder-recordings") || "[]");
        recordings.unshift({
          id: Date.now().toString(),
          name,
          type: "screenshot",
          duration: "",
          resolution: "",
          fps: "",
          size,
          date: new Date().toLocaleDateString(),
          path,
          createdAt: Date.now(),
        });
        localStorage.setItem("screen-recorder-recordings", JSON.stringify(recordings));
      } catch {}
      invoke("show_notification", {
        title: "Screenshot",
        body: "Screenshot captured",
      });
    } catch (err) {
      if (savedPos) await win.setPosition(savedPos).catch(() => {});
      console.error("Screenshot failed:", err);
    }
  }, [settings.saveLocation]);

  useEffect(() => {
    (async () => {
      try {
        const [mic, audio] = await invoke<[boolean, boolean]>("get_session_audio_state");
        setMicEnabled(mic);
        setAudioEnabled(audio);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let unlistenRecording: () => void;
    let unlistenShortcut: () => void;

    (async () => {
      unlistenRecording = await listen<{ micEnabled?: boolean; audioEnabled?: boolean }>("recording-started", (event) => {
        setIsRecordingPhase(true);
        setElapsed(0);
        if (event.payload.micEnabled != null) setMicEnabled(event.payload.micEnabled);
        if (event.payload.audioEnabled != null) setAudioEnabled(event.payload.audioEnabled);
      });
      unlistenShortcut = await listen("shortcut-trigger-screenshot", () => {
        captureScreenshot();
      });
      emit("toolbar-ready");
    })();

    return () => {
      unlistenRecording?.();
      unlistenShortcut?.();
    };
  }, [captureScreenshot]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const stopToolbarEvents = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    },
    [],
  );

  // Real OS window drag — moves the actual toolbar window on the desktop.
  const handleToolbarPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-toolbar-interactive="true"]')) return;
    getCurrentWindow().startDragging();
  }, []);

  // Listen for pause/resume from main window
  useEffect(() => {
    const unlisten = listen("toolbar-toggle-pause", () => {
      setIsPaused((p) => !p);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Resize toolbar width to fit content
  useEffect(() => {
    const w = showPenOptions ? 750 : 520;
    getCurrentWindow().setSize(new LogicalSize(w, 56));
  }, [showPenOptions]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleStop = async () => {
    try {
      await emit("tray-stop-recording");
      invoke("close_toolbar_window");
    } catch (e) {
      console.error(e);
      // Fallback
      invoke("stop_recording");
      invoke("close_toolbar_window");
    }
  };

  const handleStart = async () => {
    try {
      await emit("tray-start-recording");
    } catch {}
  };

  const handlePause = async () => {
    const willPause = !isPaused;
    setIsPaused(willPause);
    try {
      await invoke(willPause ? "pause_recording" : "resume_recording");
    } catch {}
    try {
      await emit("recording-toggle-pause");
    } catch {}
  };

  const toggleDrawing = async () => {
    const newMode = !drawingMode;
    setDrawingMode(newMode);
    setShowPenOptions(newMode);
    if (!newMode) setEraserMode(false);
    try {
      await invoke("toggle_drawing_mode", {
        enabled: newMode,
        color: penColor,
        size: penSize,
        eraser: eraserMode,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updatePenStyle = async (
    color: string,
    size: number,
    eraser?: boolean,
  ) => {
    const isErasing = eraser ?? eraserMode;
    setPenColor(color);
    setPenSize(size);
    if (isErasing) setEraserMode(false);
    try {
      await invoke("set_drawing_pen_style", { color, size, eraser: isErasing });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleEraser = async () => {
    const newEraser = !eraserMode;
    setEraserMode(newEraser);
    try {
      await invoke("set_drawing_pen_style", {
        color: penColor,
        size: penSize,
        eraser: newEraser,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const clearDrawing = async () => {
    try {
      await invoke("clear_drawing");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      onPointerDown={handleToolbarPointerDown}
      style={{
        width: "100%",
        maxWidth: "fit-content",
        height: "100%",
        backgroundColor: "#1a1a2e",
        borderRadius: "12px",
        border: "1px solid #2a2a3e",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: "none",
        cursor: "grab",
        scrollbarWidth: "none",
        zIndex: 999999999,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "56px",
          padding: "0 16px",
          gap: "6px",
        }}
      >
        {/* Drag Handle (visual only — whole bar is draggable now) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px",
            marginLeft: "-8px",
            marginRight: "4px",
          }}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="#a1a1aa">
            <circle cx="4" cy="5" r="1.5" />
            <circle cx="4" cy="10" r="1.5" />
            <circle cx="4" cy="15" r="1.5" />
            <circle cx="8" cy="5" r="1.5" />
            <circle cx="8" cy="10" r="1.5" />
            <circle cx="8" cy="15" r="1.5" />
          </svg>
        </div>

        {/* Start / Stop */}
        {!isRecordingPhase ? (
          <button
            data-toolbar-interactive="true"
            onPointerDown={stopToolbarEvents}
            onMouseDown={stopToolbarEvents}
            onClick={(e) => {
              stopToolbarEvents(e);
              handleStart();
            }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Start Recording"
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "white",
              }}
            />
          </button>
        ) : (
          <button
            data-toolbar-interactive="true"
            onPointerDown={stopToolbarEvents}
            onMouseDown={stopToolbarEvents}
            onClick={(e) => {
              stopToolbarEvents(e);
              handleStop();
            }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            onClick={(e) => {
              stopToolbarEvents(e);
              handlePause();
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
            }}
          >
            {isPaused ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>
        )}

        {/* Divider */}
        <div
          style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }}
        />

        {/* Timer */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isPaused && (
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
              }}
            />
          )}
          <span
            style={{
              fontSize: "13px",
              fontFamily: "monospace",
              color: "#d4d4d8",
              minWidth: "40px",
            }}
          >
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }}
        />

        {/* Mic */}
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => {
            stopToolbarEvents(e);
            setMicEnabled((prev) => !prev);
          }}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: micEnabled ? "transparent" : "rgba(239,68,68,0.1)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: micEnabled ? "#a1a1aa" : "#f87171",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
            {!micEnabled && <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" />}
          </svg>
        </button>

        {/* Audio */}
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => {
            stopToolbarEvents(e);
            setAudioEnabled((prev) => !prev);
          }}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: audioEnabled
              ? "transparent"
              : "rgba(239,68,68,0.1)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: audioEnabled ? "#a1a1aa" : "#f87171",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            {!audioEnabled && <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" />}
          </svg>
        </button>

        {/* Capture Screenshot */}
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => {
            stopToolbarEvents(e);
            captureScreenshot();
          }}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a1a1aa",
          }}
          title="Capture Screenshot"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>

        {/* Divider */}
        <div
          style={{ width: "1px", height: "20px", backgroundColor: "#2a2a3e" }}
        />

        {/* Pen */}
        <button
          data-toolbar-interactive="true"
          onPointerDown={stopToolbarEvents}
          onMouseDown={stopToolbarEvents}
          onClick={(e) => {
            stopToolbarEvents(e);
            toggleDrawing();
          }}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: drawingMode
              ? "rgba(59,130,246,0.15)"
              : "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: drawingMode ? "#3b82f6" : "#a1a1aa",
          }}
          title="Toggle Drawing"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
        </button>

        {/* Inline pen options */}
        {showPenOptions && drawingMode && (
          <>
            <div
              data-toolbar-interactive="true"
              onPointerDown={stopToolbarEvents}
              onMouseDown={stopToolbarEvents}
              style={{ display: "flex", gap: "4px", alignItems: "center" }}
            >
              {["#ef4444", "#3b82f6", "#ffffff"].map((c) => (
                <button
                  key={c}
                  data-toolbar-interactive="true"
                  onPointerDown={stopToolbarEvents}
                  onMouseDown={stopToolbarEvents}
                  onClick={(e) => {
                    stopToolbarEvents(e);
                    updatePenStyle(c, penSize);
                  }}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: c,
                    border:
                      penColor === c && !eraserMode
                        ? "2px solid #a1a1aa"
                        : "2px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <input
              data-toolbar-interactive="true"
              type="color"
              value={penColor}
              onChange={(e) => {
                updatePenStyle(e.target.value, penSize);
              }}
              style={{
                width: "24px",
                height: "24px",
                padding: 0,
                border: "none",
                cursor: "pointer",
                background: "transparent",
                flexShrink: 0,
              }}
              title="Pick Color"
            />
            <button
              data-toolbar-interactive="true"
              onPointerDown={stopToolbarEvents}
              onMouseDown={stopToolbarEvents}
              onClick={(e) => {
                stopToolbarEvents(e);
                toggleEraser();
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: eraserMode
                  ? "rgba(239,68,68,0.15)"
                  : "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: eraserMode ? "#f87171" : "#a1a1aa",
                flexShrink: 0,
              }}
              title="Eraser"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 20H7l-5-5 9-9 9 9-5 5Z" />
                <path d="m18 13-12 0" />
              </svg>
            </button>
            <input
              data-toolbar-interactive="true"
              type="range"
              min={1}
              max={12}
              value={penSize}
              onChange={(e) => updatePenStyle(penColor, Number(e.target.value))}
              style={{
                width: "60px",
                height: "4px",
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <span
              data-toolbar-interactive="true"
              style={{
                fontSize: "11px",
                color: "#a1a1aa",
                minWidth: "20px",
                flexShrink: 0,
              }}
            >
              {penSize}px
            </span>
          </>
        )}

        {/* Clear Drawing */}
        {drawingMode && (
          <button
            data-toolbar-interactive="true"
            onPointerDown={stopToolbarEvents}
            onMouseDown={stopToolbarEvents}
            onClick={(e) => {
              stopToolbarEvents(e);
              clearDrawing();
            }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f87171",
            }}
            title="Clear Drawing"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
