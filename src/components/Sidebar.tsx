import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-[60px]" : "w-[220px]"} bg-bg-secondary border-r border-border-primary flex flex-col h-full shrink-0 transition-all duration-200`}>
      {/* Logo + Collapse toggle */}
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="5" />
          </svg>
        </div>
        {!collapsed && <span className="font-semibold text-sm tracking-tight text-text-primary">ScreenRecorder</span>}
      </div>

      {/* Collapse button */}
      <div className="px-3 mb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <path d="m15 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? "bg-accent-bg text-accent-text"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <span className={isActive ? "text-accent-text" : "text-text-muted"}>
                {iconMap[item.icon]}
              </span>
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Premium Card */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-accent-border">
          <p className="text-xs font-semibold text-accent-text">Go Premium</p>
          <p className="text-[11px] text-text-muted mt-0.5">Unlock powerful features</p>
          <button className="mt-2.5 w-full py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-xs font-medium text-white transition-colors">
            Upgrade
          </button>
        </div>
      )}

      {/* User */}
      <div className={`px-3 pb-4 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-medium text-text-secondary shrink-0">
          MR
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">Md. Robiul Alam</p>
            <p className="text-[10px] text-text-muted">Offline Mode</p>
          </div>
        )}
      </div>
    </aside>
  );
}
