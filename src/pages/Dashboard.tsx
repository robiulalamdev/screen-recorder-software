import { useRecordings } from "../stores/recordingsStore";
import { invoke } from "@tauri-apps/api/core";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";

interface DashboardProps {
  onNavigate: (page: Page, tab?: string) => void;
  onStartRecording?: () => void;
}

const actionCards = [
  { id: "recording", title: "Start Recording", shortcut: "Ctrl + Shift + R", icon: "record" },
  { id: "window", title: "Record Window", shortcut: "Alt + Shift + W", icon: "window" },
  { id: "area", title: "Record Area", shortcut: "Alt + Shift + A", icon: "area" },
  { id: "settings", title: "Settings", shortcut: "Ctrl + ,", icon: "settings" },
];

function ActionIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "record":
      return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>;
    case "window":
      return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>;
    case "area":
      return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>;
    case "settings":
      return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
    default: return null;
  }
}

export default function Dashboard({ onNavigate, onStartRecording }: DashboardProps) {
  const { recordings } = useRecordings();
  const recentRecordings = recordings.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 w-full max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Welcome back!</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Record your screen, share your ideas.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {actionCards.map((card) => (
          <button
            key={card.id}
            onClick={() => {
              if (card.id === "recording") onStartRecording?.();
              else if (card.id === "settings") onNavigate("settings", "general");
            }}
            className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl border transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: card.id === "recording" ? "var(--accent-bg)" : "var(--bg-tertiary)",
              borderColor: card.id === "recording" ? "var(--accent-border)" : "var(--border-primary)",
            }}
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: card.id === "recording" ? "var(--accent)" : "var(--bg-elevated)",
                color: card.id === "recording" ? "#fff" : "var(--text-secondary)",
              }}
            >
              <ActionIcon icon={card.icon} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{card.title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{card.shortcut}</p>
            </div>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Recordings</h2>
          <button onClick={() => onNavigate("recordings")} className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--text-muted)" }}>
            View all
          </button>
        </div>
        <div className="space-y-2">
          {recentRecordings.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border transition-colors cursor-pointer group"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
            >
              <div className="hidden sm:flex w-24 h-14 rounded-lg items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{rec.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{rec.duration} &middot; {rec.resolution} &middot; {rec.fps}</p>
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
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search recordings..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
