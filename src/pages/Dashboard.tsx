import { useRecordings } from "../stores/recordingsStore";
import { invoke } from "@tauri-apps/api/core";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";

interface DashboardProps {
  onNavigate: (page: Page, tab?: string) => void;
  onStartRecording?: () => void;
}

export default function Dashboard({ onNavigate, onStartRecording }: DashboardProps) {
  const { recordings } = useRecordings();
  const recentRecordings = recordings.slice(0, 5);
  const screenshotCount = recordings.filter((r) => r.type === "screenshot").length;
  const videoCount = recordings.filter((r) => r.type !== "screenshot").length;

  return (
    <div className="p-4 sm:p-6 w-full max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Videos</p>
          <p className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{videoCount}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Screenshots</p>
          <p className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{screenshotCount}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Recordings</p>
          <p className="text-xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{recordings.length}</p>
        </div>
      </div>

      {/* Start Recording button */}
      <button
        onClick={onStartRecording}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] mb-6"
        style={{
          backgroundColor: "var(--accent)",
          borderColor: "var(--accent-border)",
          color: "#fff",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="5" fill="currentColor" />
        </svg>
        <span className="text-base font-semibold">Start Recording</span>
        <span className="text-xs opacity-70 ml-1">Ctrl + Shift + R</span>
      </button>

      {/* Quick actions row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => onNavigate("recordings")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors hover:opacity-80"
          style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            <rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>
          All Recordings
        </button>
        <button
          onClick={() => onNavigate("settings", "general")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors hover:opacity-80"
          style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          Settings
        </button>
        <button
          onClick={() => onNavigate("shortcuts")}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors hover:opacity-80"
          style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01" />
          </svg>
          Shortcuts
        </button>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent</h2>
          {recordings.length > 0 && (
            <button onClick={() => onNavigate("recordings")} className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
              View all
            </button>
          )}
        </div>
        {recentRecordings.length > 0 ? (
          <div className="space-y-2">
            {recentRecordings.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border transition-colors cursor-pointer group"
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
              >
                <div className="hidden sm:flex w-24 h-14 rounded-lg items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-elevated)" }}>
                  {rec.type === "screenshot" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                      <rect x="2" y="6" width="14" height="12" rx="2" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{rec.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {rec.type === "screenshot" ? "Screenshot" : `${rec.duration}  ${rec.resolution}  ${rec.fps}`}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{rec.size}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{rec.date}</p>
                </div>
                <button
                  onClick={() => invoke("open_file", { path: rec.path }).catch(console.error)}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3" style={{ color: "var(--text-muted)" }}>
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No recordings yet. Start recording to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
