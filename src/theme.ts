// Apply theme IMMEDIATELY at module load — before React even mounts
// This prevents any flash of wrong theme
function getStoredTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem("screen-recorder-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.theme === "light") return "light";
      if (parsed.theme === "dark") return "dark";
    }
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const themes = {
  dark: {
    "--bg-primary": "#0d0d14", "--bg-secondary": "#13131f", "--bg-tertiary": "#16162a",
    "--bg-elevated": "#1a1a2e", "--bg-hover": "rgba(255,255,255,0.05)",
    "--border-primary": "#1e1e2e", "--border-secondary": "#2a2a3e", "--border-accent": "rgba(139,92,246,0.3)",
    "--text-primary": "#ffffff", "--text-secondary": "#d4d4d8", "--text-tertiary": "#a1a1aa", "--text-muted": "#71717a",
    "--accent": "#8b5cf6", "--accent-hover": "#7c3aed", "--accent-text": "#c084fc",
    "--accent-bg": "rgba(139,92,246,0.15)", "--accent-border": "rgba(139,92,246,0.3)",
    "--danger-text": "#f87171", "--danger-bg": "rgba(239,68,68,0.1)",
    "--success-bg": "rgba(34,197,94,0.15)", "--success-text": "#22c55e",
  },
  light: {
    "--bg-primary": "#f8f9fc", "--bg-secondary": "#ffffff", "--bg-tertiary": "#f1f3f9",
    "--bg-elevated": "#ffffff", "--bg-hover": "rgba(0,0,0,0.04)",
    "--border-primary": "#e2e5ee", "--border-secondary": "#d1d5e0", "--border-accent": "rgba(139,92,246,0.35)",
    "--text-primary": "#18181b", "--text-secondary": "#3f3f46", "--text-tertiary": "#71717a", "--text-muted": "#a1a1aa",
    "--accent": "#7c3aed", "--accent-hover": "#6d28d9", "--accent-text": "#7c3aed",
    "--accent-bg": "rgba(139,92,246,0.1)", "--accent-border": "rgba(139,92,246,0.35)",
    "--danger-text": "#dc2626", "--danger-bg": "rgba(220,38,38,0.08)",
    "--success-bg": "rgba(22,163,74,0.1)", "--success-text": "#16a34a",
  },
} as const;

export function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  const vars = themes[theme];
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  document.body.style.backgroundColor = vars["--bg-primary"];
  document.body.style.color = vars["--text-primary"];
}

// Apply immediately on import — before any React render
applyTheme(getStoredTheme());
