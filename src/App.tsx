import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Recordings from "./pages/Recordings";
import Settings from "./pages/Settings";
import ShortcutsPage from "./pages/ShortcutsPage";
import About from "./pages/About";
import SelectionOverlay from "./components/SelectionOverlay";
import Countdown from "./components/Countdown";
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

  // Use refs for values that event listeners need — avoids stale closures
  const recordingStartTimeRef = useRef<number>(0);
  const actualFilePathRef = useRef<string | null>(null);
  const recordingStateRef = useRef<RecordingState>("idle");
  const isStoppingRef = useRef(false);

  const { settings } = useSettings();
  const { addRecording } = useRecordings();

  // Keep recordingState ref in sync
  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const handleStopRecording = useCallback(async () => {
    // Guard against double-stop
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      await invoke("stop_recording");
    } catch {}

    // Wait for ffmpeg to finalize the file (Rust waits up to 3s + kill)
    await new Promise((r) => setTimeout(r, 2000));

    try {
      await invoke("close_toolbar_window");
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
    setRecordingState("saved");
    isStoppingRef.current = false;

    try {
      await invoke("show_notification", {
        title: "Recording Saved",
        body: `${fileName} has been saved.`,
      });
    } catch {}

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

      const win = getCurrentWindow();
      await win.setFullscreen(true);
      await new Promise((r) => setTimeout(r, 300));
      setRecordingState("selecting");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError({ type: "recording-failed", message: String(err) });
    }
  }, [settings.saveLocation]);

  const handleCapture = useCallback(async (mode: string, bounds?: { x: number; y: number; w: number; h: number }) => {
    setCaptureMode(mode as "fullscreen" | "window" | "area");
    setCaptureBounds(bounds || null);

    const win = getCurrentWindow();
    await win.setFullscreen(false);
    await new Promise((r) => setTimeout(r, 200));

    setRecordingState("countdown");
  }, []);

  const handleCountdownComplete = useCallback(async () => {
    try {
      await invoke("create_toolbar_window");
    } catch (err) {
      console.error("Failed to hide window:", err);
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
      await invoke("close_toolbar_window");
      setRecordingState("idle");
    }
  }, [settings, captureMode, captureBounds]);

  const handleDismissSaved = useCallback(() => {
    setRecordingState("idle");
    setSavedRecording(null);
    actualFilePathRef.current = null;
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

      {recordingState === "countdown" && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      <CameraOverlay
        visible={isRecording && cameraVisible}
        shape={cameraShape}
        onShapeChange={setCameraShape}
        onToggle={handleCameraToggle}
      />

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
  return <MainWindow />;
}

export default App;
