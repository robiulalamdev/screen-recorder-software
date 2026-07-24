type ErrorType = "no-microphone" | "disk-full" | "permission-denied" | "recording-failed" | "encoder-unavailable" | "camera-not-found" | "ffmpeg-not-found";

interface ErrorNotificationProps { type: ErrorType; onDismiss: () => void; onOpenSettings?: () => void; }

const errorConfig: Record<ErrorType, { title: string; message: string }> = {
  "no-microphone": { title: "No Microphone", message: "Connect a microphone and grant permission." },
  "disk-full": { title: "Disk Full", message: "Not enough disk space. Please free up space." },
  "permission-denied": { title: "Permission Denied", message: "Screen recording permission required." },
  "recording-failed": { title: "Recording Failed", message: "Something went wrong. Please try again." },
  "encoder-unavailable": { title: "Encoder Unavailable", message: "Selected encoder not supported." },
  "camera-not-found": { title: "Camera Not Found", message: "No camera detected." },
  "ffmpeg-not-found": { title: "FFmpeg Not Installed", message: "Install: brew install ffmpeg" },
};

export default function ErrorNotification({ type, onDismiss, onOpenSettings }: ErrorNotificationProps) {
  const config = errorConfig[type];
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[360px] rounded-2xl p-5 shadow-2xl"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--danger-text)" }}>
      <button onClick={onDismiss} className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-colors" style={{ color: "var(--text-muted)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--danger-text)" }}>{config.title}</h3>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{config.message}</p>
      </div>
      <div className="flex gap-2">
        {onOpenSettings && (
          <button onClick={onOpenSettings} className="flex-1 px-3 py-2.5 rounded-xl border text-sm transition-colors"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}>Settings</button>
        )}
        <button onClick={onDismiss} className="px-3 py-2.5 rounded-xl border text-sm transition-colors"
          style={{ backgroundColor: "var(--danger-bg)", borderColor: "var(--danger-text)", color: "var(--danger-text)" }}>Dismiss</button>
      </div>
    </div>
  );
}
