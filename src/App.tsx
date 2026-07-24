import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Recordings from "./pages/Recordings";
import Settings from "./pages/Settings";
import ShortcutsPage from "./pages/ShortcutsPage";
import About from "./pages/About";
import SelectionOverlay from "./components/SelectionOverlay";
import Countdown from "./components/Countdown";
import FloatingToolbar from "./components/FloatingToolbar";
import RecordingSuccess from "./components/RecordingSuccess";
import CanvasDrawing from "./components/CanvasDrawing";
import CameraOverlay from "./components/CameraOverlay";
import ErrorNotification from "./components/ErrorNotification";
import { useSettings } from "./stores/settingsStore";
import { useRecordings } from "./stores/recordingsStore";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";
type RecordingState = "idle" | "selecting" | "countdown" | "recording" | "paused" | "saved";
type CameraShape = "circle" | "rounded" | "square";
type ErrorType = "no-microphone" | "disk-full" | "permission-denied" | "recording-failed" | "encoder-unavailable" | "camera-not-found" | "ffmpeg-not-found";

// Toolbar Window - renders floating toolbar in separate window
function ToolbarWindow() {
  const [isPaused, setIsPaused] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(4);
  const [cameraVisible, setCameraVisible] = useState(false);

  useEffect(() => {
    const unlistenPause = listen("toolbar-toggle-pause", () => {
      setIsPaused((p) => !p);
    });
    return () => {
      unlistenPause.then((fn) => fn());
    };
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await invoke("stop_recording");
      await emit("recording-stop");
      await invoke("close_toolbar_window");
    } catch {}
  }, []);

  const handleTogglePause = useCallback(async () => {
    setIsPaused((p) => !p);
    try {
      if (isPaused) {
        await invoke("resume_recording");
      } else {
        await invoke("pause_recording");
      }
    } catch {}
    await emit("recording-toggle-pause");
  }, [isPaused]);

  return (
    <div className="bg-transparent">
      <FloatingToolbar
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onStop={handleStop}
        onToolSelect={setActiveTool}
        activeTool={activeTool}
        cameraVisible={cameraVisible}
        onCameraToggle={() => setCameraVisible(!cameraVisible)}
        drawColor={drawColor}
        onColorChange={setDrawColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
      />
    </div>
  );
}

// Main Window - renders the full application
function MainWindow() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [settingsTab, setSettingsTab] = useState("general");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(4);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraShape, setCameraShape] = useState<CameraShape>("circle");
  const [error, setError] = useState<{ type: ErrorType; message?: string } | null>(null);
  const [savedRecording, setSavedRecording] = useState<{
    fileName: string;
    fileSize: string;
    duration: string;
    filePath: string;
  } | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  const { settings } = useSettings();
  const { addRecording } = useRecordings();

  // Listen for events from toolbar window
  useEffect(() => {
    const unlistenStop = listen("recording-stop", () => {
      handleStopRecording();
    });

    const unlistenPause = listen("recording-toggle-pause", () => {
      setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
    });

    const unlistenTrayStart = listen("tray-start-recording", () => {
      if (recordingState === "idle") {
        handleStartRecording();
      }
    });

    const unlistenTrayStop = listen("tray-stop-recording", () => {
      if (recordingState === "recording" || recordingState === "paused") {
        handleStopRecording();
      }
    });

    const unlistenTrayPause = listen("tray-pause-recording", () => {
      if (recordingState === "recording" || recordingState === "paused") {
        setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
      }
    });

    return () => {
      unlistenStop.then((fn) => fn());
      unlistenPause.then((fn) => fn());
      unlistenTrayStart.then((fn) => fn());
      unlistenTrayStop.then((fn) => fn());
      unlistenTrayPause.then((fn) => fn());
    };
  }, [recordingState]);

  const handleNavigate = (page: Page, tab?: string) => {
    setCurrentPage(page);
    if (tab) setSettingsTab(tab);
  };

  const handleStartRecording = useCallback(async () => {
    try {
      // Check FFmpeg
      const ffmpegInstalled = await invoke<boolean>("check_ffmpeg_installed");
      if (!ffmpegInstalled) {
        setError({ type: "ffmpeg-not-found", message: "FFmpeg is not installed. Please install FFmpeg: brew install ffmpeg" });
        return;
      }

      // Check permissions
      const perms = await invoke<{ screen: boolean }>("check_permissions");
      if (!perms.screen) {
        setError({ type: "permission-denied" });
        return;
      }

      // Check disk space
      const diskSpace = await invoke<{ availableGB: number }>("get_disk_space", { path: settings.saveLocation || "~/Downloads" });
      if (diskSpace.availableGB < 0.5) {
        setError({ type: "disk-full" });
        return;
      }

      // Make main window fullscreen for selection
      const win = getCurrentWindow();
      await win.setFullscreen(true);
      await new Promise((r) => setTimeout(r, 300));
      setRecordingState("selecting");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setRecordingState("selecting");
    }
  }, [settings.saveLocation]);

  const handleCapture = useCallback(async (_mode: string, _bounds?: { x: number; y: number; w: number; h: number }) => {
    // Exit fullscreen
    const win = getCurrentWindow();
    await win.setFullscreen(false);
    await new Promise((r) => setTimeout(r, 200));

    // Create toolbar window
    try {
      await invoke("create_toolbar_window");
    } catch (err) {
      console.error("Failed:", err);
    }
    setRecordingState("countdown");
  }, []);

  const handleCountdownComplete = useCallback(async () => {
    setRecordingState("recording");
    setRecordingStartTime(Date.now());

    // Start actual recording via Rust backend
    try {
      await invoke("start_recording", {
        options: {
          mode: "fullscreen",
          fps: settings.frameRate,
          quality: settings.videoQuality,
          encoder: settings.encoder,
          outputFormat: settings.outputFormat,
          microphone: settings.microphone,
          systemAudio: settings.systemAudio,
          micVolume: settings.micVolume,
          systemVolume: settings.systemVolume,
          saveLocation: settings.saveLocation,
        },
      });
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError({ type: "recording-failed", message: String(err) });
      setRecordingState("idle");
    }
  }, [settings]);

  const handleStopRecording = useCallback(async () => {
    try {
      await invoke("stop_recording");
      await invoke("close_toolbar_window");
    } catch {}

    const duration = Date.now() - recordingStartTime;
    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const durationStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const now = new Date();
    const fileName = `Recording_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}.${settings.outputFormat}`;
    const filePath = `${settings.saveLocation}/${fileName}`;

    // Save to recordings store
    addRecording({
      name: fileName,
      duration: durationStr,
      resolution: settings.resolution === "original" ? "1920x1080" : settings.resolution.toUpperCase(),
      fps: `${settings.frameRate} FPS`,
      size: "N/A",
      date: now.toLocaleDateString(),
      path: filePath,
    });

    setSavedRecording({
      fileName,
      fileSize: "Recording complete",
      duration: durationStr,
      filePath,
    });

    setCameraVisible(false);
    setActiveTool(null);
    setRecordingState("saved");

    // Show notification
    try {
      await invoke("show_notification", {
        title: "Recording Saved",
        body: `${fileName} has been saved.`,
      });
    } catch {}

    // Open folder if setting enabled
    if (settings.autoOpenFolder) {
      try {
        await invoke("open_folder", { path: settings.saveLocation });
      } catch {}
    }
  }, [recordingStartTime, settings, addRecording]);

  const handleDismissSaved = useCallback(() => {
    setRecordingState("idle");
    setSavedRecording(null);
  }, []);

  const handleToolSelect = useCallback((tool: string | null) => {
    if (tool === null) {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setActiveTool(null);
    } else {
      setActiveTool(tool);
    }
  }, []);

  const handleCameraToggle = useCallback(() => {
    setCameraVisible((prev) => !prev);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} onStartRecording={handleStartRecording} />;
      case "recordings":
        return <Recordings />;
      case "settings":
        return <Settings activeTab={settingsTab} />;
      case "shortcuts":
        return <ShortcutsPage />;
      case "about":
        return <About />;
      default:
        return <Dashboard onNavigate={handleNavigate} onStartRecording={handleStartRecording} />;
    }
  };

  const isRecording = recordingState === "recording" || recordingState === "paused";

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white flex">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>

      {/* Selection Overlay - renders fullscreen in main window */}
      {recordingState === "selecting" && (
        <SelectionOverlay
          onCapture={handleCapture}
          onCancel={async () => {
            const win = getCurrentWindow();
            await win.setFullscreen(false);
            setRecordingState("idle");
          }}
        />
      )}

      {/* Countdown */}
      {recordingState === "countdown" && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {/* Canvas Drawing Layer */}
      {isRecording && activeTool && (
        <CanvasDrawing
          tool={activeTool as "pen" | "highlighter" | "arrow" | "rectangle" | "circle" | "text"}
          color={drawColor}
          brushSize={brushSize}
          onUndo={() => {}}
          onRedo={() => {}}
          canUndo={false}
          canRedo={false}
        />
      )}

      {/* Camera Overlay */}
      <CameraOverlay
        visible={isRecording && cameraVisible}
        shape={cameraShape}
        onShapeChange={setCameraShape}
        onToggle={handleCameraToggle}
      />

      {/* Floating Toolbar - fallback in main window for non-Tauri environments */}
      {isRecording && (
        <FloatingToolbar
          isPaused={recordingState === "paused"}
          onTogglePause={async () => {
            const newState = recordingState === "recording" ? "paused" : "recording";
            setRecordingState(newState);
            try {
              if (newState === "paused") {
                await invoke("pause_recording");
              } else {
                await invoke("resume_recording");
              }
            } catch {}
          }}
          onStop={handleStopRecording}
          onToolSelect={handleToolSelect}
          activeTool={activeTool}
          cameraVisible={cameraVisible}
          onCameraToggle={handleCameraToggle}
          drawColor={drawColor}
          onColorChange={setDrawColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          onScreenshot={async () => {
            try {
              const path = await invoke<string>("take_screenshot", { saveLocation: settings.saveLocation });
              await invoke("show_notification", {
                title: "Screenshot Saved",
                body: path,
              });
            } catch (err) {
              setError({ type: "recording-failed", message: `Screenshot failed: ${err}` });
            }
          }}
        />
      )}

      {/* Recording Success */}
      {recordingState === "saved" && savedRecording && (
        <RecordingSuccess
          fileName={savedRecording.fileName}
          fileSize={savedRecording.fileSize}
          duration={savedRecording.duration}
          onOpenFile={async () => {
            try {
              await invoke("open_file", { path: savedRecording.filePath });
            } catch {}
            handleDismissSaved();
          }}
          onOpenFolder={async () => {
            try {
              await invoke("open_folder", { path: settings.saveLocation });
            } catch {}
            handleDismissSaved();
          }}
          onCopyPath={() => {
            navigator.clipboard?.writeText(savedRecording.filePath);
            handleDismissSaved();
          }}
          onDelete={async () => {
            try {
              await invoke("delete_file", { path: savedRecording.filePath });
            } catch {}
            handleDismissSaved();
          }}
          onDismiss={handleDismissSaved}
        />
      )}

      {/* Error Notification */}
      {error && (
        <ErrorNotification
          type={error.type}
          onDismiss={() => setError(null)}
          onOpenSettings={error.type === "permission-denied" || error.type === "ffmpeg-not-found" ? () => {
            setError(null);
            handleNavigate("settings", "general");
          } : undefined}
        />
      )}
    </div>
  );
}

// Window Router - detect which window we're in
function App() {
  const [windowLabel, setWindowLabel] = useState<string>("main");

  useEffect(() => {
    const currentWindow = getCurrentWindow();
    setWindowLabel(currentWindow.label);
  }, []);

  switch (windowLabel) {
    case "toolbar":
      return <ToolbarWindow />;
    default:
      return <MainWindow />;
  }
}

export default App;
