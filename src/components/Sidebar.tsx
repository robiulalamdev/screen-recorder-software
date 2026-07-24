import type React from "react";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, tab?: string) => void;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "recordings", label: "Recordings", icon: "recordings" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "shortcuts", label: "Shortcuts", icon: "shortcuts" },
  { id: "about", label: "About", icon: "about" },
];

const iconMap: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  recordings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  shortcuts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.001" /><path d="M10 8h.001" /><path d="M14 8h.001" />
      <path d="M6 12h.001" /><path d="M10 12h.001" /><path d="M14 12h.001" />
      <path d="M6 16h12" />
    </svg>
  ),
  about: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  ),
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full border-r" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
      {/* Logo */}
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="5" />
          </svg>
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>ScreenRecorder</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1"
              style={{
                backgroundColor: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              <span style={{ color: isActive ? "var(--accent-text)" : "var(--text-muted)" }}>
                {iconMap[item.icon]}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Premium Card */}
      <div className="mx-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>Go Premium</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Unlock powerful features</p>
        <button className="mt-2.5 w-full py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-xs font-medium text-white transition-colors">
          Upgrade
        </button>
      </div>

      {/* User */}
      <div className="px-3 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
          MR
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>Md. Robiul Alam</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Offline Mode</p>
        </div>
      </div>
    </aside>
  );
}
