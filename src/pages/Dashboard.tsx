type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";

interface DashboardProps {
  onNavigate: (page: Page, tab?: string) => void;
  onStartRecording?: () => void;
}

const actionCards = [
  {
    id: "recording",
    title: "Start Recording",
    shortcut: "Ctrl + Shift + R",
    icon: "record",
    color: "from-purple-500 to-blue-500",
  },
  {
    id: "window",
    title: "Record Window",
    shortcut: "Alt + Shift + W",
    icon: "window",
    color: "from-zinc-700 to-zinc-600",
  },
  {
    id: "area",
    title: "Record Area",
    shortcut: "Alt + Shift + A",
    icon: "area",
    color: "from-zinc-700 to-zinc-600",
  },
  {
    id: "settings",
    title: "Settings",
    shortcut: "Ctrl + ,",
    icon: "settings",
    color: "from-zinc-700 to-zinc-600",
  },
];

const mockRecordings = [
  {
    id: "1",
    name: "Project Demo.mp4",
    duration: "00:12:45",
    resolution: "1920x1080",
    fps: "60 FPS",
    size: "23.8 MB",
    date: "Today, 10:30 AM",
  },
  {
    id: "2",
    name: "UI Design Review.mp4",
    duration: "00:08:19",
    resolution: "1920x1080",
    fps: "60 FPS",
    size: "15.6 MB",
    date: "Today, 09:15 AM",
  },
  {
    id: "3",
    name: "Bug Fix Walkthrough.mp4",
    duration: "00:17:32",
    resolution: "2560x1440",
    fps: "60 FPS",
    size: "35.7 MB",
    date: "Yesterday, 04:20 PM",
  },
  {
    id: "4",
    name: "Feature Explanation.mp4",
    duration: "00:06:51",
    resolution: "1920x1080",
    fps: "30 FPS",
    size: "11.3 MB",
    date: "Yesterday, 11:10 AM",
  },
];

function ActionIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "record":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      );
    case "window":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8" /><path d="M12 17v4" />
        </svg>
      );
    case "area":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        </svg>
      );
    case "settings":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Dashboard({ onNavigate, onStartRecording }: DashboardProps) {
  return (
    <div className="p-6 max-w-[900px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Welcome back! 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Record your screen, share your ideas.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {actionCards.map((card) => (
          <button
            key={card.id}
            onClick={() => {
              if (card.id === "recording") onStartRecording?.();
              else if (card.id === "settings") onNavigate("settings", "general");
              else onNavigate("dashboard");
            }}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:scale-[1.02] ${
              card.id === "recording"
                ? "bg-gradient-to-br from-purple-500/15 to-blue-500/15 border-purple-500/30 hover:border-purple-500/50"
                : "bg-[#16162a] border-[#1e1e2e] hover:border-zinc-600"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                card.id === "recording"
                  ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              <ActionIcon icon={card.icon} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{card.title}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{card.shortcut}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Recordings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recent Recordings</h2>
          <button
            onClick={() => onNavigate("recordings")}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            View all
          </button>
        </div>

        <div className="space-y-2">
          {mockRecordings.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-[#16162a] border border-[#1e1e2e] hover:border-zinc-600 transition-colors cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="w-24 h-14 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{rec.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {rec.duration} &middot; {rec.resolution} &middot; {rec.fps}
                </p>
              </div>

              {/* Size & Date */}
              <div className="text-right shrink-0">
                <p className="text-xs text-zinc-400">{rec.size}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{rec.date}</p>
              </div>

              {/* Play */}
              <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>

              {/* More */}
              <button className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search recordings..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>
          <button className="p-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button className="p-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
