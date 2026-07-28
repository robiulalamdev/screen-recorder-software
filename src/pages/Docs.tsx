import { useState } from "react";

interface Section {
  id: string; label: string; icon: string;
  content: { title: string; blocks: Block[] };
}

type Block =
  | { type: "text"; lines: string[] }
  | { type: "code"; lines: string[] }
  | { type: "divider" }
  | { type: "badge"; text: string; color: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: { label: string; desc: string }[] }
  | { type: "steps"; items: string[] }
  | { type: "command"; cmd: string };

const sections: Section[] = [
  {
    id: "overview", label: "Overview", icon: "ℹ️",
    content: {
      title: "Overview",
      blocks: [
        { type: "badge", text: "v0.1.0", color: "var(--accent)" },
        { type: "badge", text: "Tauri v2", color: "#3b82f6" },
        { type: "badge", text: "React 19", color: "#22c55e" },
        { type: "badge", text: "MIT License", color: "#f59e0b" },
        { type: "text", lines: [
          "Recora is a lightweight, offline-first desktop screen recorder built with Tauri + React + TypeScript.",
          "Records your screen with a floating toolbar for controls, drawing tools for annotations, camera overlay support, and a built-in recordings library — all without requiring an internet connection.",
        ]},
        { type: "divider" },
        { type: "text", lines: ["**Key Features**"] },
        { type: "list", items: [
          { label: "Screen Recording", desc: "Full screen, window, or custom area" },
          { label: "Drawing Tools", desc: "Pen, highlighter, arrow, shapes, blur, pixelate" },
          { label: "Camera Overlay", desc: "Webcam PIP — draggable, resizable, multiple shapes" },
          { label: "System Tray", desc: "Start, pause, stop from tray menu" },
          { label: "Recordings Library", desc: "Browse, search, sort, rename, delete" },
          { label: "Custom Shortcuts", desc: "Record keyboard shortcuts from the UI" },
          { label: "Dark/Light Theme", desc: "System-aware theming" },
        ]},
      ],
    },
  },
  {
    id: "architecture", label: "Architecture", icon: "🏗️",
    content: {
      title: "Architecture",
      blocks: [
        { type: "text", lines: ["The app follows a hybrid **Tauri Shell + React Frontend** architecture communicating via an event system."] },
        { type: "divider" },
        { type: "text", lines: ["**Tauri Shell (Rust)**"] },
        { type: "list", items: [
          { label: "Recording Engine", desc: "Spawns, pauses, resumes, and stops capture processes" },
          { label: "Window Management", desc: "Creates/manages toolbar, overlay, and drawing sub-windows" },
          { label: "File System", desc: "Read, write, delete, rename, duplicate files" },
          { label: "Global Shortcuts", desc: "Registers system-wide keyboard shortcuts" },
          { label: "System Tray", desc: "Tray icon with recording controls menu" },
        ]},
        { type: "text", lines: ["**React Frontend (TypeScript)**"] },
        { type: "list", items: [
          { label: "SPA Routing", desc: "Hash-based window routing (main/overlay/toolbar/drawing)" },
          { label: "State Machines", desc: "Page navigation + recording lifecycle state machines" },
          { label: "localStorage Stores", desc: "Persistent settings and recordings store" },
          { label: "Event-Driven", desc: "Tauri event system for cross-window communication" },
        ]},
      ],
    },
  },
  {
    id: "tech-stack", label: "Tech Stack", icon: "⚙️",
    content: {
      title: "Tech Stack",
      blocks: [
        { type: "table", headers: ["Layer", "Technology"], rows: [
          ["Desktop Shell", "Tauri v2"],
          ["Frontend", "React 19 + TypeScript"],
          ["Styling", "Tailwind CSS v4"],
          ["Icons", "Inline SVG"],
          ["Theme", "next-themes"],
          ["Recording", "avfoundation (macOS)"],
          ["State", "React hooks + localStorage"],
          ["Build", "Vite + Tauri CLI"],
          ["Package Manager", "npm"],
        ]},
      ],
    },
  },
  {
    id: "project-structure", label: "Structure", icon: "📁",
    content: {
      title: "Project Structure",
      blocks: [
        { type: "code", lines: [
          "application/",
          "├── src/",
          "│   ├── App.tsx              # Main app + state machine",
          "│   ├── main.tsx             # Entry point",
          "│   ├── index.css            # Tailwind + CSS variables",
          "│   ├── assets/",
          "│   │   └── logo.png         # App logo",
          "│   ├── components/",
          "│   │   ├── Sidebar.tsx      # Collapsible navigation",
          "│   │   ├── ThemeProvider.tsx # next-themes wrapper",
          "│   │   ├── OverlayWindow.tsx # Selection overlay",
          "│   │   ├── Countdown.tsx    # 3-2-1 countdown",
          "│   │   ├── ToolbarWindow.tsx # Recording controls",
          "│   │   ├── CanvasDrawing.tsx # Drawing canvas",
          "│   │   ├── DrawingWindow.tsx # Overlay drawing",
          "│   │   ├── CameraOverlay.tsx # Webcam PIP",
          "│   │   ├── RecordingSuccess.tsx # Save toast",
          "│   │   └── ErrorNotification.tsx # Errors",
          "│   ├── pages/",
          "│   │   ├── Dashboard.tsx    # Home screen",
          "│   │   ├── Recordings.tsx   # Library (list/grid)",
          "│   │   ├── Settings.tsx     # App settings",
          "│   │   ├── ShortcutsPage.tsx # Shortcuts ref",
          "│   │   ├── About.tsx        # About the app",
          "│   │   └── Docs.tsx         # Documentation",
          "│   └── stores/",
          "│       ├── settingsStore.ts # Persistent settings",
          "│       └── recordingsStore.ts # Recordings CRUD",
          "└── src-tauri/",
          "    ├── src/",
          "    │   ├── lib.rs           # All Rust commands",
          "    │   ├── main.rs          # Rust entry point",
          "    │   └── overlay.rs       # Reserved",
          "    ├── Cargo.toml           # Rust deps",
          "    └── tauri.conf.json      # Tauri config",
        ]},
      ],
    },
  },
  {
    id: "recording-flow", label: "Recording Flow", icon: "🎬",
    content: {
      title: "Recording Flow",
      blocks: [
        { type: "text", lines: ["The complete lifecycle of a recording session:"] },
        { type: "divider" },
        { type: "steps", items: [
          'User clicks "Start Recording" on Dashboard',
          "Rust checks permissions (screen, mic, camera)",
          "Rust checks disk space (≥0.5 GB required)",
          "Rust creates fullscreen overlay window (#overlay)",
          "Overlay captures desktop screenshot as background",
          "User selects area: fullscreen, preset ratio, or custom drag",
          "User clicks record button on overlay toolbar",
          "Rust closes overlay, returns to main window",
          "3-2-1 countdown plays (unless disabled in settings)",
          "Rust creates toolbar (#toolbar) + drawing (#drawing) windows",
          "Toolbar emits toolbar-ready signal to main window",
          "Main window emits recording-started → toolbar begins timer",
          "Rust starts capture process with selected encoding options",
          "Recording runs with live toolbar controls:",
        ]},
        { type: "list", items: [
          { label: "Stop", desc: "SIGINT → wait 3s → SIGKILL → finalize file" },
          { label: "Pause / Resume", desc: "Suspends / resumes capture process" },
          { label: "Screenshot", desc: "screencapture CLI" },
          { label: "Drawing", desc: "Toggle annotation mode" },
        ]},
        { type: "steps", items: [
          "On stop: Rust closes toolbar + drawing windows",
          "Main window computes duration & file size",
          "Recording saved to localStorage store",
          "Success notification + toast with Open/Open Folder/Copy Path/Delete",
          "File auto-opened in system player",
        ]},
      ],
    },
  },
  {
    id: "components", label: "Components", icon: "🧩",
    content: {
      title: "Key Components",
      blocks: [
        { type: "text", lines: ["**Sidebar**"] },
        { type: "list", items: [
          { label: "Navigation", desc: "Collapsible 60px / 200px with auto-collapse on <768px" },
          { label: "Persistence", desc: "State saved in localStorage" },
        ]},
        { type: "text", lines: ["**OverlayWindow**"] },
        { type: "list", items: [
          { label: "Selection", desc: "Fullscreen transparent overlay with desktop screenshot bg" },
          { label: "Presets", desc: "Fullscreen / Custom / 3:4 / 4:3 / 9:16 / 16:9 ratios" },
          { label: "Controls", desc: "Resize handles, move, ESC cancel, mic/audio toggles, FPS" },
        ]},
        { type: "text", lines: ["**ToolbarWindow**"] },
        { type: "list", items: [
          { label: "Controls", desc: "Stop, Pause/Resume, Timer, Mic, Audio, Screenshot" },
          { label: "Drawing", desc: "Color picker, brush size, eraser, clear" },
          { label: "Drag", desc: "OS-level window drag" },
        ]},
        { type: "text", lines: ["**CanvasDrawing / DrawingWindow**"] },
        { type: "list", items: [
          { label: "Tools", desc: "Pen, highlighter, arrow, line, rectangle, circle, text" },
          { label: "Effects", desc: "Blur and pixelate with intensity control" },
          { label: "Undo/Redo", desc: "Ctrl+Z / Ctrl+Shift+Z" },
        ]},
        { type: "text", lines: ["**CameraOverlay**"] },
        { type: "list", items: [
          { label: "Webcam PIP", desc: "Draggable, resizable 80–400px, circle/rounded/square" },
        ]},
      ],
    },
  },
  {
    id: "tauri-commands", label: "Commands", icon: "🔧",
    content: {
      title: "Tauri Rust Commands",
      blocks: [
        { type: "text", lines: ["**Recording**"] },
        { type: "table", headers: ["Command", "Description"], rows: [
          ["start_recording()", "Starts capture with selected settings"],
          ["stop_recording()", "Sends stop signal → finalizes file"],
          ["pause_recording()", "Suspends capture process"],
          ["resume_recording()", "Resumes capture process"],
          ["take_screenshot()", "screencapture CLI"],
        ]},
        { type: "text", lines: ["**Window Management**"] },
        { type: "table", headers: ["Command", "Description"], rows: [
          ["create_selection_overlay()", "Creates #overlay window"],
          ["close_selection_overlay()", "Closes overlay, shows main"],
          ["create_toolbar_window()", "Creates floating toolbar"],
          ["close_toolbar_window()", "Closes toolbar"],
          ["create_drawing_window()", "Creates drawing overlay"],
          ["close_drawing_window()", "Closes drawing overlay"],
          ["minimize_main_window()", "Minimize to tray"],
          ["restore_main_window()", "Restore from tray"],
        ]},
        { type: "text", lines: ["**Drawing**"] },
        { type: "table", headers: ["Command", "Description"], rows: [
          ["toggle_drawing_mode()", "Enable/disable drawing"],
          ["set_drawing_pen_style()", "Update color/size/eraser"],
          ["clear_drawing()", "Clear all annotations"],
        ]},
        { type: "text", lines: ["**File Operations**"] },
        { type: "table", headers: ["Command", "Description"], rows: [
          ["open_file()", "Open with system default"],
          ["open_folder()", "Reveal in Finder"],
          ["delete_file()", "Delete from filesystem"],
          ["rename_file()", "Rename file"],
          ["duplicate_file()", "Copy file"],
          ["get_file_size()", "Size in bytes"],
          ["validate_recordings()", "Filter existing paths"],
          ["list_recordings()", "List video files in folder"],
          ["generate_thumbnail()", "Generates video thumbnail"],
        ]},
      ],
    },
  },
  {
    id: "stores", label: "State", icon: "💾",
    content: {
      title: "Stores & State",
      blocks: [
        { type: "text", lines: ["**settingsStore (useSettings)**"] },
        { type: "table", headers: ["Category", "Fields"], rows: [
          ["General", "saveLocation, autoCreateFolders, autoOpenFolder, minimizeToTray, launchOnStartup, theme, language"],
          ["Recording", "videoQuality, frameRate, resolution, encoder, outputFormat, countdownEnabled"],
          ["Audio", "microphone, systemAudio, micVolume, systemVolume, noiseSuppression, echoCancellation"],
          ["Shortcuts", "startStop, pauseResume, stop, mute, screenshot, showToolbar"],
        ]},
        { type: "divider" },
        { type: "text", lines: ["**recordingsStore (useRecordings)**"] },
        { type: "list", items: [
          { label: "Storage", desc: "localStorage under screen-recorder-recordings" },
          { label: "CRUD", desc: "addRecording, deleteRecording, renameRecording, duplicateRecording" },
          { label: "Validation", desc: "On mount: checks all file paths exist, removes stale entries" },
        ]},
        { type: "divider" },
        { type: "text", lines: ["**Main Window State Machine**"] },
        { type: "list", items: [
          { label: "currentPage", desc: "dashboard | recordings | settings | shortcuts | about | docs" },
          { label: "recordingState", desc: "idle → selecting → countdown → recording → paused → saved" },
          { label: "Persistent", desc: "sidebarCollapsed in localStorage" },
        ]},
      ],
    },
  },
  {
    id: "settings", label: "Settings", icon: "⚙️",
    content: {
      title: "Settings Reference",
      blocks: [
        { type: "table", headers: ["Section", "Setting", "Options"], rows: [
          ["General", "Save Location", "~/Downloads (default, configurable)"],
          ["General", "Theme", "Dark / Light / System"],
          ["Recording", "Quality", "Low / Medium / High / Ultra"],
          ["Recording", "Frame Rate", "24 / 30 / 60 FPS"],
          ["Recording", "Resolution", "Original / 1080p / 1440p / 4K"],
          ["Recording", "Encoder", "H.264 / H.265 / AV1"],
          ["Recording", "Format", "MP4 / WebM / MKV"],
          ["Recording", "Countdown", "On / Off"],
          ["Audio", "Microphone", "Default / USB / Bluetooth / Muted"],
          ["Audio", "System Audio", "Default / Headphones / Speakers / Muted"],
          ["Audio", "Mic Volume", "0–100 slider"],
          ["Audio", "System Volume", "0–100 slider"],
          ["Audio", "Noise Suppression", "Toggle"],
          ["Audio", "Echo Cancellation", "Toggle"],
          ["Shortcuts", "Start/Stop", "Ctrl + Shift + R"],
          ["Shortcuts", "Pause/Resume", "Ctrl + Shift + P"],
          ["Shortcuts", "Stop", "Ctrl + Shift + S"],
          ["Shortcuts", "Mute", "Ctrl + Shift + M"],
          ["Shortcuts", "Screenshot", "Ctrl + Shift + C"],
          ["Shortcuts", "Toolbar", "Ctrl + Shift + T"],
        ]},
      ],
    },
  },
  {
    id: "shortcuts", label: "Shortcuts", icon: "⌨️",
    content: {
      title: "Keyboard Shortcuts",
      blocks: [
        { type: "table", headers: ["Shortcut", "Action"], rows: [
          ["Ctrl + Shift + R", "Start / Stop Recording"],
          ["Ctrl + Shift + P", "Pause / Resume Recording"],
          ["Ctrl + Shift + S", "Stop Recording"],
          ["Ctrl + Shift + C", "Take Screenshot (during recording)"],
          ["Ctrl + Shift + T", "Toggle Toolbar"],
          ["Ctrl + Z", "Undo last drawing stroke"],
          ["Ctrl + Shift + Z", "Redo last drawing stroke"],
          ["ESC", "Cancel selection overlay"],
        ]},
      ],
    },
  },
  {
    id: "windows", label: "Windows", icon: "🪟",
    content: {
      title: "Window Types",
      blocks: [
        { type: "table", headers: ["Window", "Purpose", "Properties"], rows: [
          ["#main", "Primary app window", "1100×800, resizable, transparent, close → minimize"],
          ["#overlay", "Area selection", "Fullscreen, borderless, always-on-top, skips taskbar"],
          ["#toolbar", "Recording controls", "Floating 650×56, always-on-top, draggable, transparent"],
          ["#drawing", "Annotations canvas", "Fullscreen, transparent, ignores cursor when idle"],
        ]},
      ],
    },
  },
  {
    id: "theming", label: "Theming", icon: "🎨",
    content: {
      title: "Theming System",
      blocks: [
        { type: "text", lines: ["Powered by **next-themes** with CSS custom properties. No hardcoded colors in components."] },
        { type: "divider" },
        { type: "text", lines: ["**Dark Theme (default)**"] },
        { type: "table", headers: ["Variable", "Value"], rows: [
          ["--bg-primary", "#0d0d14"],
          ["--bg-secondary", "#13131f"],
          ["--bg-tertiary", "#16162a"],
          ["--bg-elevated", "#1a1a2e"],
          ["--border-primary", "#1e1e2e"],
          ["--text-primary", "#ffffff"],
          ["--text-muted", "#71717a"],
          ["--accent", "#8b5cf6"],
          ["--accent-text", "#c084fc"],
        ]},
        { type: "text", lines: ["**Light Theme**"] },
        { type: "table", headers: ["Variable", "Value"], rows: [
          ["--bg-primary", "#f8f9fc"],
          ["--bg-secondary", "#ffffff"],
          ["--text-primary", "#18181b"],
          ["--accent", "#7c3aed"],
        ]},
        { type: "divider" },
        { type: "text", lines: ["Toggle: **Settings → General → Theme** (Dark / Light / System)"] },
      ],
    },
  },
  {
    id: "development", label: "Dev Guide", icon: "🛠️",
    content: {
      title: "Development Guide",
      blocks: [
        { type: "text", lines: ["**Prerequisites**"] },
        { type: "list", items: [
          { label: "Node.js", desc: "18+" },
          { label: "Rust", desc: "Latest stable" },
          { label: "Tauri CLI", desc: "cargo install tauri-cli" },
        ]},
        { type: "command", cmd: "git clone <repo> && cd application && npm install" },
        { type: "divider" },
        { type: "text", lines: ["**Run in development mode**"] },
        { type: "command", cmd: "npx tauri dev" },
        { type: "list", items: [
          { label: "Frontend", desc: "Vite dev server on localhost:1420 with HMR" },
          { label: "Rust", desc: "Auto-compiled on changes" },
        ]},
        { type: "divider" },
        { type: "text", lines: ["**Other commands**"] },
        { type: "command", cmd: "npx tsc --noEmit    # Type-check only" },
        { type: "command", cmd: "npm run build        # Frontend build only" },
        { type: "divider" },
        { type: "text", lines: ["**Code Conventions**"] },
        { type: "list", items: [
          { label: "TypeScript", desc: "Strict mode" },
          { label: "React", desc: "Functional components with hooks" },
          { label: "Styling", desc: "Tailwind CSS v4 + CSS custom properties" },
          { label: "Icons", desc: "Inline SVG (no icon library)" },
          { label: "Naming", desc: "Components: PascalCase, Stores: camelCase with use* prefix" },
        ]},
      ],
    },
  },
  {
    id: "build-deploy", label: "Build", icon: "📦",
    content: {
      title: "Build & Deploy",
      blocks: [
        { type: "text", lines: ["**Production Build**"] },
        { type: "command", cmd: "npx tauri build" },
        { type: "text", lines: ["Produces:"] },
        { type: "list", items: [
          { label: "Recora.app", desc: "src-tauri/target/release/bundle/macos/Recora.app" },
          { label: "Recora.dmg", desc: "src-tauri/target/release/bundle/dmg/Recora_0.1.0_x64.dmg" },
        ]},
        { type: "divider" },
        { type: "text", lines: ["**Bundle Configuration (tauri.conf.json)**"] },
        { type: "list", items: [
          { label: "productName", desc: "Recora" },
          { label: "identifier", desc: "com.screenrecorder.desktop" },
          { label: "macOSPrivateApi", desc: "true (transparent windows)" },
          { label: "Icons", desc: ".icns, .ico, .png (multiple sizes)" },
        ]},
        { type: "divider" },
        { type: "text", lines: ["**Runtime Requirements**"] },
        { type: "list", items: [
          { label: "Platform", desc: "macOS (avfoundation) — cross-platform planned" },
          { label: "Permissions", desc: "Screen Recording (prompted on first use)" },
        ]},
      ],
    },
  },
];

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "text":
      return (
        <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          {block.lines.map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line.startsWith("**") && line.endsWith("**")
                ? <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{line.slice(2, -2)}</span>
                : line.includes("**")
                  ? line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <span key={k} className="font-semibold" style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</span>
                        : part
                    )
                  : line
              }
            </span>
          ))}
        </p>
      );
    case "code":
      return (
        <pre key={i} className="text-xs leading-relaxed p-4 rounded-xl mb-4 overflow-x-auto" style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>
          {block.lines.join("\n")}
        </pre>
      );
    case "command":
      return (
        <div key={i} className="flex items-center gap-2 p-3 rounded-xl mb-3 font-mono text-sm" style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--accent-text)" }}>
          <span style={{ color: "var(--text-muted)" }}>$</span>
          {block.cmd}
        </div>
      );
    case "divider":
      return <div key={i} className="my-4" style={{ height: "1px", backgroundColor: "var(--border-primary)" }} />;
    case "badge":
      return (
        <span key={i} className="inline-block px-2.5 py-1 rounded-full text-xs font-medium mr-2 mb-2" style={{ backgroundColor: `${block.color}20`, color: block.color }}>
          {block.text}
        </span>
      );
    case "table":
      return (
        <div key={i} className="rounded-xl overflow-hidden mb-4 border" style={{ borderColor: "var(--border-primary)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-tertiary)" }}>
                {block.headers.map((h, j) => (
                  <th key={j} className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-primary)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j} className="transition-colors hover:opacity-90" style={{ borderBottom: j < block.rows.length - 1 ? "1px solid var(--border-primary)" : "none" }}>
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-2.5" style={{ color: k === 0 ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: k === 1 ? "pre-line" : "nowrap" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list":
      return (
        <div key={i} className="space-y-1.5 mb-4">
          {block.items.map((item, j) => (
            <div key={j} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <span className="font-medium text-sm shrink-0" style={{ color: "var(--text-primary)" }}>{item.label}</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{item.desc}</span>
            </div>
          ))}
        </div>
      );
    case "steps":
      return (
        <div key={i} className="space-y-2 mb-4">
          {block.items.map((item, j) => (
            <div key={j} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                {j + 1}
              </span>
              <span className="text-sm pt-0.5" style={{ color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>
      );
  }
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState("overview");
  const section = sections.find((s) => s.id === activeSection);

  return (
    <div className="flex h-full">
      <nav className="shrink-0 overflow-y-auto p-3 w-52 space-y-0.5" style={{ borderRight: "1px solid var(--border-primary)" }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: activeSection === s.id ? "var(--accent-bg)" : "transparent",
              color: activeSection === s.id ? "var(--accent-text)" : "var(--text-muted)",
            }}
          >
            <span className="text-base">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        {section && (
          <>
            <h1 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {section.content.title}
            </h1>
            <div className="max-w-[720px]">
              {section.content.blocks.map((block, i) => renderBlock(block, i))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
