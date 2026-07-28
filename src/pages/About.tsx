type Page = "dashboard" | "recordings" | "settings" | "shortcuts" | "about" | "docs";

import logoUrl from "../assets/logo.png";

interface AboutProps {
  onNavigate: (page: Page) => void;
}

export default function About({ onNavigate }: AboutProps) {
  return (
    <div className="p-4 sm:p-6 w-full max-w-[500px]">
      <h1
        className="text-xl font-semibold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        About
      </h1>
      <div className="flex items-center gap-4 mb-8">
        <img src={logoUrl} alt="Recora" className="w-16 h-16 rounded-2xl shrink-0" />
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Recora
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Version 0.1.0
          </p>
        </div>
      </div>
      {[
        { label: "Developer", value: "Robiul Alam" },
        { label: "License", value: "MIT" },
        { label: "Framework", value: "Tauri + React" },
        { label: "Platform", value: "Cross-Platform" },
      ].map(({ label, value }, i, arr) => (
        <div
          key={label}
          className="flex items-center justify-between py-3"
          style={{
            borderBottom:
              i < arr.length - 1 ? "1px solid var(--border-primary)" : "none",
          }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {value}
          </span>
        </div>
      ))}

      {/* Social links */}
      <button
        onClick={() => onNavigate("docs")}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors hover:opacity-80 mb-4"
        style={{ backgroundColor: "var(--accent)", borderColor: "var(--accent-border)", color: "#fff" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h4" />
        </svg>
        View Documentation
      </button>
      <div className="flex items-center justify-center gap-4 mt-2">
        <a
          href="https://robiulalamdev.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-muted)",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Portfolio
        </a>
        <a
          href="https://github.com/robiulalamdev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--text-muted)", transition: "color 0.15s" }}
          className="hover:text-white"
          title="GitHub"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <a
          href="https://linkedin.com/in/robiulalamdev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--text-muted)", transition: "color 0.15s" }}
          className="hover:text-white"
          title="LinkedIn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
        <a
          href="https://gitlab.com/robiulalamdev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--text-muted)", transition: "color 0.15s" }}
          className="hover:text-white"
          title="GitLab"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.68 10.29l1.47-4.52c.1-.31.1-.31.2 0l1.47 4.52H4.68zm-.63.71l-.36-1.12-2.43 7.48c-.13.4 0 .84.34 1.09L12 23.56l10.4-5.21c.34-.25.47-.69.34-1.09l-2.43-7.48-.36 1.12H4.05zM22.28 11l-1.47-4.52c-.1-.31-.1-.31-.2 0l-1.47 4.52h3.14z" />
          </svg>
        </a>
        <a
          href="https://facebook.com/robiulalamdev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--text-muted)", transition: "color 0.15s" }}
          className="hover:text-white"
          title="Facebook"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      </div>

      <p
        className="mt-8 text-xs text-center"
        style={{ color: "var(--text-muted)" }}
      >
        A lightweight, offline-first desktop screen recorder.
      </p>
    </div>
  );
}
