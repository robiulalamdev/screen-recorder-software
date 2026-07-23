import { useState, useCallback } from "react";
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

function App() {
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

  const handleStartRecording = useCallback(() => {
    setRecordingState("selecting");
  }, []);

  const handleCapture = useCallback((_mode: string) => {
    setRecordingState("countdown");
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setRecordingState("recording");
  }, []);

  const handleTogglePause = useCallback(() => {
    setRecordingState((prev) => (prev === "recording" ? "paused" : "recording"));
  }, []);

  const handleStopRecording = useCallback(() => {
    setCameraVisible(false);
    setActiveTool(null);
    setRecordingState("saved");
  }, []);

  const handleDismissSaved = useCallback(() => {
    setRecordingState("idle");
  }, []);

  const handleToolSelect = useCallback((tool: string | null) => {
    if (tool === null) {
      // Clear drawings
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

      {/* Selection Overlay */}
      {recordingState === "selecting" && (
        <SelectionOverlay
          onCapture={handleCapture}
          onCancel={() => setRecordingState("idle")}
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

      {/* Floating Toolbar */}
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

export default App;
