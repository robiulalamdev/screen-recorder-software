import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import ThemeProvider from "./components/ThemeProvider";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Recordings from "./pages/Recordings";
import Settings from "./pages/Settings";
import ShortcutsPage from "./pages/ShortcutsPage";
import About from "./pages/About";
import SelectionOverlay from "./components/SelectionOverlay";
import Countdown from "./components/Countdown";
import FloatingToolbar from "./components/FloatingToolbar";
import CanvasDrawing from "./components/CanvasDrawing";
import type { DrawTool } from "./components/CanvasDrawing";
import RecordingSuccess from "./components/RecordingSuccess";
import CameraOverlay from "./components/CameraOverlay";
import ErrorNotification from "./components/ErrorNotification";
import { useSettings } from "./stores/settingsStore";
import { useRecordings } from "./stores/recordingsStore";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";
type RecordingState = "idle" | "selecting" | "countdown" | "recording" | "paused" | "saved";
type CameraShape = "circle" | "rounded" | "square";
type ErrorType = "no-microphone" | "disk-full" | "permission-denied" | "recording-failed" | "encoder-unavailable" | "camera-not-found" | "ffmpeg-not-found";

function MainWindow() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [settingsTab, setSettingsTab] = useState("general");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraShape, setCameraShape] = useState<CameraShape>("circle");
  const [error, setError] = useState<{ type: ErrorType; message?: string } | null>(null);
  const [savedRecording, setSavedRecording] = useState<{
    fileName: string;
    fileSize: string;
    duration: string;
    filePath: string;
  } | null>(null);
  const [captureBounds, setCaptureBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [captureMode, setCaptureMode] = useState<"fullscreen" | "window" | "area">("fullscreen");
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [activeDrawTool, setActiveDrawTool] = useState<DrawTool | null>(null);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(4);

  const recordingStartTimeRef = useRef<number>(0);
  const actualFilePathRef = useRef<string | null>(null);
  const recordingStateRef = useRef<RecordingState>("idle");
  const isStoppingRef = useRef(false);

  const { settings } = useSettings();
  const { addRecording } = useRecordings();

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const handleStopRecording = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      await invoke("stop_recording");
    } catch {}

    await new Promise((r) => setTimeout(r, 2000));

    try {
      await invoke("restore_main_window");
    } catch {}

    const duration = Date.now() - recordingStartTimeRef.current;
    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const durationStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const filePath = actualFilePathRef.current || "";
    const fileName = filePath.split("/").pop() || "Recording.mp4";

    let fileSize = "N/A";
    try {
      const sizeBytes = await invoke<number>("get_file_size", { path: filePath });
      if (sizeBytes > 1048576) {
        fileSize = `${(sizeBytes / 1048576).toFixed(1)} MB`;
      } else {
        fileSize = `${(sizeBytes / 1024).toFixed(1)} KB`;
      }
    } catch {}

    addRecording({
      name: fileName,
      duration: durationStr,
      resolution: settings.resolution === "original" ? "1920x1080" : settings.resolution.toUpperCase(),
      fps: `${settings.frameRate} FPS`,
      size: fileSize,
      date: new Date().toLocaleDateString(),
      path: filePath,
    });

    setSavedRecording({ fileName, fileSize, duration: durationStr, filePath });
    setCameraVisible(false);
    setActiveDrawTool(null);
    setRecordingState("saved");
    isStoppingRef.current = false;

    try {
      await invoke("show_notification", {
        title: "Recording Saved",
        body: `${fileName} has been saved.`,
      });
    } catch {}

    // Auto-open the recorded video so user can see it instantly
    if (filePath) {
      try {
        await invoke("open_file", { path: filePath });
      } catch {}
    }

    if (settings.autoOpenFolder) {
      try {
        const expandedPath = await invoke<string>("get_file_url", { path: settings.saveLocation });
        await invoke("open_folder", { path: expandedPath });
      } catch {}
    }
  }, [settings, addRecording]);

  // Listen for events from toolbar / tray
  useEffect(() => {
    const unlistenStop = listen("recording-stop", () => {
      handleStopRecording();
    });

    const unlistenPause = listen("recording-toggle-pause", () => {
      setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
    });

    const unlistenTrayStart = listen("tray-start-recording", () => {
      if (recordingStateRef.current === "idle") {
        handleStartRecording();
      }
    });

    const unlistenTrayStop = listen("tray-stop-recording", () => {
      const s = recordingStateRef.current;
      if (s === "recording" || s === "paused") {
        handleStopRecording();
      }
    });

    const unlistenTrayPause = listen("tray-pause-recording", () => {
      setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
    });

    return () => {
      unlistenStop.then((fn) => fn());
      unlistenPause.then((fn) => fn());
      unlistenTrayStart.then((fn) => fn());
      unlistenTrayStop.then((fn) => fn());
      unlistenTrayPause.then((fn) => fn());
    };
  }, [handleStopRecording]);

  const handleNavigate = (page: Page, tab?: string) => {
    setCurrentPage(page);
    if (tab) setSettingsTab(tab);
  };

  const handleStartRecording = useCallback(async () => {
    try {
      const ffmpegInstalled = await invoke<boolean>("check_ffmpeg_installed");
      if (!ffmpegInstalled) {
        setError({ type: "ffmpeg-not-found", message: "FFmpeg is not installed. Please install FFmpeg: brew install ffmpeg" });
        return;
      }

      const perms = await invoke<{ screen: boolean }>("check_permissions");
      if (!perms.screen) {
        setError({ type: "permission-denied" });
        return;
      }

      const expandedPath = settings.saveLocation.replace("~", await invoke<string>("get_home_dir"));
      const diskSpace = await invoke<{ availableGB: number }>("get_disk_space", { path: expandedPath });
      if (diskSpace.availableGB < 0.5) {
        setError({ type: "disk-full" });
        return;
      }

      // Minimize the app window so it doesn't appear in the screenshot
      const win = getCurrentWindow();
      await win.minimize();
      await new Promise((r) => setTimeout(r, 300));

      // Capture a screenshot of the screen for the selection overlay
      try {
        const path = await invoke<string>("capture_screen");
        setScreenshotPath(path);
      } catch {
        setScreenshotPath(null);
      }

      // Show selection overlay
      setRecordingState("selecting");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError({ type: "recording-failed", message: String(err) });
    }
  }, [settings.saveLocation]);

  const handleCapture = useCallback(async (mode: string, bounds?: { x: number; y: number; w: number; h: number }) => {
    setCaptureMode(mode as "fullscreen" | "window" | "area");
    setCaptureBounds(bounds || null);

    // Restore the app window after selection
    const win = getCurrentWindow();
    await win.unminimize();
    await new Promise((r) => setTimeout(r, 200));

    if (settings.countdownEnabled) {
      setRecordingState("countdown");
    } else {
      // Skip countdown, start recording directly
      handleCountdownComplete();
    }
  }, [settings.countdownEnabled]);

  const handleCountdownComplete = useCallback(async () => {
    // Minimize app window so it doesn't appear in recording
    try {
      await invoke("minimize_main_window");
    } catch (err) {
      console.error("Failed to minimize window:", err);
    }

    recordingStartTimeRef.current = Date.now();
    setRecordingState("recording");

    try {
      const filePath = await invoke<string>("start_recording", {
        options: {
          mode: captureMode,
          x: captureBounds?.x,
          y: captureBounds?.y,
          width: captureBounds?.w,
          height: captureBounds?.h,
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
      actualFilePathRef.current = filePath;
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError({ type: "recording-failed", message: String(err) });
      await invoke("restore_main_window");
      setRecordingState("idle");
    }
  }, [settings, captureMode, captureBounds]);

  const handleDismissSaved = useCallback(() => {
    setRecordingState("idle");
    setSavedRecording(null);
    actualFilePathRef.current = null;
    setScreenshotPath(null);
  }, []);

  const handleCameraToggle = useCallback(() => {
    setCameraVisible((prev) => !prev);
  }, []);

  const handleTogglePause = useCallback(() => {
    setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
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
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      {/* Recording toolbar - shown at top during recording */}
      {isRecording && (
        <div className="shrink-0">
          <FloatingToolbar
            isPaused={recordingState === "paused"}
            onTogglePause={handleTogglePause}
            onStop={handleStopRecording}
            cameraVisible={cameraVisible}
            onCameraToggle={handleCameraToggle}
            activeTool={activeDrawTool}
            onToolSelect={(t) => setActiveDrawTool(t as DrawTool | null)}
            drawColor={drawColor}
            onColorChange={setDrawColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
          />
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar hidden during recording */}
        {!isRecording && (
          <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        )}

        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>

      {/* Canvas drawing overlay during recording */}
      {isRecording && (
        <CanvasDrawing
          tool={activeDrawTool}
          color={drawColor}
          brushSize={brushSize}
        />
      )}

      {/* Selection Overlay — shows screenshot of screen for area selection */}
      {recordingState === "selecting" && (
        <SelectionOverlay
          screenshotPath={screenshotPath}
          onCapture={handleCapture}
          onCancel={async () => {
            const win = getCurrentWindow();
            await win.unminimize();
            setRecordingState("idle");
            setScreenshotPath(null);
          }}
        />
      )}

      {/* Countdown */}
      {recordingState === "countdown" && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {/* Camera Overlay */}
      <CameraOverlay
        visible={isRecording && cameraVisible}
        shape={cameraShape}
        onShapeChange={setCameraShape}
        onToggle={handleCameraToggle}
      />

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

function App() {
  return (
    <ThemeProvider>
      <MainWindow />
    </ThemeProvider>
  );
}

export default App;
