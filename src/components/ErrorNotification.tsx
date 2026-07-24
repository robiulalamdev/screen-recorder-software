type ErrorType = "no-microphone" | "disk-full" | "permission-denied" | "recording-failed" | "encoder-unavailable" | "camera-not-found" | "ffmpeg-not-found";

interface ErrorNotificationProps {
  type: ErrorType;
  onDismiss: () => void;
  onOpenSettings?: () => void;
}

const errorConfig: Record<ErrorType, { title: string; message: string; icon: string }> = {
  "no-microphone": {
    title: "No Microphone Detected",
    message: "Please connect a microphone and grant permission to record audio.",
    icon: "mic-off",
  },
  "disk-full": {
    title: "Disk Full",
    message: "Not enough disk space to save the recording. Please free up space.",
    icon: "disk",
  },
  "permission-denied": {
    title: "Permission Denied",
    message: "Screen recording permission is required. Please grant access in System Settings.",
    icon: "shield",
  },
  "recording-failed": {
    title: "Recording Failed",
    message: "Something went wrong while recording. Please try again.",
    icon: "alert",
  },
  "encoder-unavailable": {
    title: "Encoder Unavailable",
    message: "The selected video encoder is not supported on this system.",
    icon: "settings",
  },
  "camera-not-found": {
    title: "Camera Not Found",
    message: "No camera detected. Please connect a camera to use this feature.",
    icon: "camera",
  },
  "ffmpeg-not-found": {
    title: "FFmpeg Not Installed",
    message: "FFmpeg is required for screen recording. Install it with: brew install ffmpeg",
    icon: "settings",
  },
};

function ErrorIcon({ type }: { type: string }) {
  const cls = "w-6 h-6";
  switch (type) {
    case "mic-off":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" x2="22" y1="2" y2="22" />
          <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
          <path d="M5 10v2a7 7 0 0 0 12 5" />
          <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      );
    case "disk":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" x2="2" y1="12" y2="12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          <line x1="6" x2="6.01" y1="16" y2="16" />
          <line x1="10" x2="10.01" y1="16" y2="16" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <line x1="9" x2="15" y1="9" y2="15" />
        </svg>
      );
    case "alert":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      );
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "camera":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ErrorNotification({ type, onDismiss, onOpenSettings }: ErrorNotificationProps) {
  const config = errorConfig[type];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-5 shadow-2xl">
      {/* Close */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 w-6 h-6 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
          <ErrorIcon type={config.icon} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-400">{config.title}</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{config.message}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[#16162a] border border-[#2a2a3e] text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Open Settings
          </button>
        )}
        <button
          onClick={onDismiss}
          className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${
            onOpenSettings
              ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20"
              : "flex-1 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20"
          }`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
