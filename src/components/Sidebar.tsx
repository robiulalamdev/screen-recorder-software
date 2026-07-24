import { useState, useEffect } from "react";
import type React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, tab?: string) => void;
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

const COLLAPSE_WIDTH = 800;

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < COLLAPSE_WIDTH);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < COLLAPSE_WIDTH) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sidebarWidth = collapsed ? "64px" : "220px";

  return (
    <aside
      className="shrink-0 flex flex-col"
      style={{
        width: sidebarWidth,
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-primary)",
        height: "100vh",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo + Toggle */}
      <div style={{ padding: collapsed ? "20px 0" : "20px", display: "flex", alignItems: "center", gap: "10px", justifyContent: collapsed ? "center" : "flex-start" }}>
        <div
          className="bg-gradient-to-br from-purple-500 to-blue-500"
          style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5" /></svg>
        </div>
        {!collapsed && <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>ScreenRecorder</span>}
      </div>

      {/* Toggle collapse */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          style={{
            margin: "0 12px 4px",
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid var(--border-primary)",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18 6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? "8px 6px" : "0 12px" }}>
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
                gap: "12px",
                padding: collapsed ? "10px 0" : "10px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "4px",
                border: "none",
                cursor: "pointer",
                backgroundColor: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent-text)" : "var(--text-muted)",
                textAlign: collapsed ? "center" : "left",
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

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            margin: "0 6px 8px",
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid var(--border-primary)",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Go Premium — only when expanded */}
      {!collapsed && (
        <div
          style={{
            margin: "0 12px 12px",
            padding: "12px",
            borderRadius: "12px",
            backgroundColor: "var(--accent-bg)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-text)" }}>Go Premium</p>
          <p style={{ fontSize: "11px", marginTop: "2px", color: "var(--text-muted)" }}>Unlock powerful features</p>
          <button
            className="bg-purple-500 hover:bg-purple-600"
            style={{ marginTop: "10px", width: "100%", padding: "6px 0", borderRadius: "8px", fontSize: "12px", fontWeight: 500, color: "white", border: "none", cursor: "pointer" }}
          >
            Upgrade
          </button>
        </div>
      )}

      {/* User */}
      <div style={{ padding: collapsed ? "0 6px 12px" : "0 12px 12px", display: "flex", alignItems: "center", gap: "12px", justifyContent: collapsed ? "center" : "flex-start" }}>
        <div
          style={{
            width: "32px", height: "32px", borderRadius: "50%",
            backgroundColor: "var(--bg-tertiary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", flexShrink: 0,
          }}
        >MR</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Md. Robiul Alam
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>Offline Mode</p>
          </div>
        )}
      </div>

      {/* Minimize */}
      <button
        onClick={() => getCurrentWindow().minimize()}
        style={{
          margin: collapsed ? "0 6px 12px" : "0 12px 12px",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid var(--border-primary)",
          backgroundColor: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
      </button>
    </aside>
  );
}
