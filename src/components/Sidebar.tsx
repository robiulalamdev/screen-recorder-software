import type React from "react";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, tab?: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )},
  { id: "recordings", label: "Recordings", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )},
  { id: "settings", label: "Settings", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )},
  { id: "shortcuts", label: "Shortcuts", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.001" /><path d="M10 8h.001" /><path d="M14 8h.001" />
      <path d="M6 12h.001" /><path d="M10 12h.001" /><path d="M14 12h.001" />
      <path d="M6 16h12" />
    </svg>
  )},
  { id: "about", label: "About", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  )},
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className="shrink-0 flex flex-col transition-all duration-200"
      style={{
        width: collapsed ? "60px" : "200px",
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-primary)",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo + Toggle */}
      <div style={{ padding: collapsed ? "20px 0" : "20px 16px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: collapsed ? 0 : "10px" }}>
        <div
          className="bg-gradient-to-br from-purple-500 to-blue-500"
          style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5" /></svg>
        </div>
        {!collapsed && <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", flex: 1 }}>ScreenRecorder</span>}
        <button
          onClick={onToggle}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: "4px", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? "0 8px" : "0 12px" }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : "12px",
                padding: collapsed ? "10px 0" : "10px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "4px",
                border: "none",
                cursor: "pointer",
                backgroundColor: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent-text)" : "var(--text-muted)",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ color: isActive ? "var(--accent-text)" : "var(--text-muted)", flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <>
          {/* Go Premium — Coming soon */}
          <div className="group relative" style={{ margin: "0 12px 12px", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "var(--accent-bg)", border: "1px solid var(--accent-border)", opacity: 0.6 }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-text)" }}>Go Premium</p>
              <p style={{ fontSize: "11px", marginTop: "2px", color: "var(--text-muted)" }}>Unlock powerful features</p>
              <button className="bg-purple-500" style={{ marginTop: "10px", width: "100%", padding: "6px 0", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "white", border: "none", cursor: "not-allowed", opacity: 0.7 }}>
                Upgrade
              </button>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-default" style={{ backdropFilter: "blur(2px)" }}>
              <span className="text-xs font-medium text-white/80">Coming soon</span>
            </div>
          </div>

          {/* User — Coming soon */}
          <div className="group relative" style={{ padding: "0 12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: 0.6 }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", flexShrink: 0 }}>MR</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Md. Robiul Alam</p>
                <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Offline Mode</p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-default" style={{ backdropFilter: "blur(2px)" }}>
              <span className="text-xs font-medium text-white/80">Coming soon</span>
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div style={{ padding: "0 0 16px", display: "flex", justifyContent: "center" }}>
          <div title="Coming soon" style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", cursor: "default", opacity: 0.5 }}>MR</div>
        </div>
      )}
    </aside>
  );
}
