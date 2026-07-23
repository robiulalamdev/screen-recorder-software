import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";
type RecordingState = "idle" | "selecting" | "countdown" | "recording" | "paused" | "saved";
type CameraShape = "circle" | "rounded" | "square";

// Overlay Window - renders selection overlay fullscreen
function OverlayWindow() {
  const handleCapture = useCallback(async (_mode: string) => {
    try {
      await invoke("close_overlay_window");
      await invoke("restore_main_window");
      await new Promise((r) => setTimeout(r, 200));
      await invoke("create_toolbar_window");
    } catch (err) {
      console.error("Failed:", err);
    }
  }, []);

  const handleCancel = useCallback(async () => {
    try {
      await invoke("close_overlay_window");
      await invoke("restore_main_window");
    } catch {}
  }, []);

  return <SelectionOverlay onCapture={handleCapture} onCancel={handleCancel} />;
}

// Toolbar Window - renders floating toolbar in separate window
function ToolbarWindow() {
  const [isPaused, setIsPaused] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(4);
  const [cameraVisible, setCameraVisible] = useState(false);

  const handleStop = useCallback(async () => {
    try {
      await invoke("close_toolbar_window");
    } catch {}
  }, []);

  return (
    <div className="bg-transparent">
      <FloatingToolbar
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
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

  const handleNavigate = (page: Page, tab?: string) => {
    setCurrentPage(page);
    if (tab) setSettingsTab(tab);
  };

  const handleStartRecording = useCallback(async () => {
    try {
      await invoke("minimize_main_window");
      await new Promise((r) => setTimeout(r, 300));
      await invoke("create_overlay_window");
      setRecordingState("selecting");
    } catch (err) {
      console.error("Failed:", err);
      setRecordingState("selecting");
    }
  }, []);

  const handleCapture = useCallback(async () => {
    try {
      await invoke("close_overlay_window");
      await invoke("restore_main_window");
      await new Promise((r) => setTimeout(r, 200));
      await invoke("create_toolbar_window");
    } catch (err) {
      console.error("Failed:", err);
    }
    setRecordingState("countdown");
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setRecordingState("recording");
  }, []);

  const handleTogglePause = useCallback(() => {
    setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      await invoke("close_toolbar_window");
    } catch {}
    setCameraVisible(false);
    setActiveTool(null);
    setRecordingState("saved");
  }, []);

  const handleDismissSaved = useCallback(() => {
    setRecordingState("idle");
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

      {/* Selection Overlay - fallback in main window */}
      {recordingState === "selecting" && (
        <SelectionOverlay
          onCapture={handleCapture}
          onCancel={async () => {
            try {
              await invoke("close_overlay_window");
              await invoke("restore_main_window");
            } catch {}
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

      {/* Floating Toolbar - fallback in main window */}
      {isRecording && (
        <FloatingToolbar
          isPaused={recordingState === "paused"}
          onTogglePause={handleTogglePause}
          onStop={handleStopRecording}
          onToolSelect={handleToolSelect}
          activeTool={activeTool}
          cameraVisible={cameraVisible}
          onCameraToggle={handleCameraToggle}
          drawColor={drawColor}
          onColorChange={setDrawColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
        />
      )}

      {/* Recording Success */}
      {recordingState === "saved" && (
        <RecordingSuccess
          fileName="Recording_2026-07-24_10-30-00.mp4"
          fileSize="23.8 MB"
          duration="00:12:45"
          onOpenFile={() => setRecordingState("idle")}
          onOpenFolder={() => setRecordingState("idle")}
          onCopyPath={() => {
            navigator.clipboard?.writeText("~/Downloads/ScreenRecorder/Recording_2026-07-24_10-30-00.mp4");
            setRecordingState("idle");
          }}
          onDismiss={handleDismissSaved}
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

  // Render based on window label
  switch (windowLabel) {
    case "overlay":
      return <OverlayWindow />;
    case "toolbar":
      return <ToolbarWindow />;
    default:
      return <MainWindow />;
  }
}

export default App;
