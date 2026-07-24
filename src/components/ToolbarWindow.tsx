import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export default function ToolbarWindow() {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

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
    try { await invoke("stop_recording"); } catch {}
    try { await invoke("close_toolbar_window"); } catch {}
  };

  const handlePause = async () => {
    setIsPaused((p) => !p);
    try { await invoke(isPaused ? "resume_recording" : "pause_recording"); } catch {}
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        backgroundColor: "#1a1a2e",
        borderBottom: "1px solid #2a2a3e",
        padding: "0 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: "none",
      }}
      data-tauri-drag-region
    >
      {/* Stop */}
      <button
        onClick={handleStop}
        style={{
          width: "36px", height: "36px", borderRadius: "50%",
          backgroundColor: "#ef4444", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>

      {/* Pause */}
      <button
        onClick={handlePause}
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
        onClick={() => setMicEnabled(!micEnabled)}
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
        onClick={() => setAudioEnabled(!audioEnabled)}
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
        onClick={() => setCameraVisible(!cameraVisible)}
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

      {/* Screenshot */}
      <button
        onClick={async () => { try { await invoke("take_screenshot", {}); } catch {} }}
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
  );
}
