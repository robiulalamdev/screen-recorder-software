import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTheme } from "next-themes";
import { useSettings } from "../stores/settingsStore";

interface SettingsProps { activeTab: string; }

const tabs = [
  { id: "general", label: "General" },
  { id: "recording", label: "Recording" },
  { id: "audio", label: "Audio" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "about", label: "About" },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)} className="w-10 h-[22px] rounded-full p-0.5 transition-colors shrink-0" style={{ backgroundColor: enabled ? "var(--accent)" : "var(--bg-elevated)" }}>
      <div className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

const inputCls = "flex-1 px-3 py-2 rounded-lg border text-sm outline-none";
const inputStyle = { backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" };
const optionBtnCls = "px-4 py-2 rounded-lg text-sm font-medium transition-colors";
const btnStyle = (active: boolean) => ({
  backgroundColor: active ? "var(--accent-bg)" : "var(--bg-tertiary)",
  borderColor: active ? "var(--accent-border)" : "var(--border-primary)",
  color: active ? "var(--accent-text)" : "var(--text-secondary)",
  border: "1px solid",
});

function GeneralSettings() {
  const { settings, updateSettings } = useSettings();
  const { setTheme } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Save Location</h3>
        <div className="flex items-center gap-2">
          <div className={inputCls + " truncate"} style={inputStyle}>{settings.saveLocation}</div>
          <button onClick={() => invoke<string>("select_folder").then((f) => f && updateSettings({ saveLocation: f })).catch(console.error)}
            className="px-3 py-2 rounded-lg border text-sm transition-colors shrink-0"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>Change</button>
        </div>
      </div>
      <div className="space-y-4">
        {[
          { label: "Auto create folders by Year/Month", key: "autoCreateFolders" as const },
          { label: "Auto open folder after recording", key: "autoOpenFolder" as const },
          { label: "Minimize to system tray", key: "minimizeToTray" as const },
          { label: "Launch on startup", key: "launchOnStartup" as const },
          { label: "Start minimized", key: "startMinimized" as const },
        ].map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
            <Toggle enabled={settings[key]} onChange={(v) => updateSettings({ [key]: v })} />
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Theme</h3>
        <div className="flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <button key={t} onClick={() => { updateSettings({ theme: t }); setTheme(t); }} className={optionBtnCls} style={btnStyle(settings.theme === t)}>
              {t === "dark" && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: "var(--accent-text)" }} />}
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordingSettings() {
  const { settings, updateSettings } = useSettings();
  return (
    <div className="space-y-6">
      {[
        { label: "Video Quality", options: ["low", "medium", "high", "ultra"] as const, key: "videoQuality" as const },
        { label: "Frame Rate", options: [24, 30, 60] as const, key: "frameRate" as const, suffix: " FPS" },
        { label: "Resolution", options: ["original", "1080p", "1440p", "4k"] as const, key: "resolution" as const, uppercase: true },
        { label: "Encoder", options: ["h264", "h265", "av1"] as const, key: "encoder" as const, uppercase: true },
        { label: "Output Format", options: ["mp4", "webm", "mkv"] as const, key: "outputFormat" as const, uppercase: true },
      ].map(({ label, options, key, suffix = "", uppercase }) => (
        <div key={key}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>{label}</h3>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button key={opt} onClick={() => updateSettings({ [key]: opt })} className={optionBtnCls + (uppercase ? " uppercase" : "")} style={btnStyle(settings[key] === opt)}>
                {opt}{suffix}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Enable Countdown</span>
        <Toggle enabled={settings.countdownEnabled} onChange={(v) => updateSettings({ countdownEnabled: v })} />
      </div>
    </div>
  );
}

function AudioSettings() {
  const { settings, updateSettings } = useSettings();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Microphone</h3>
        <select value={settings.microphone} onChange={(e) => updateSettings({ microphone: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
          <option>Default</option><option>USB Microphone</option><option>Bluetooth Microphone</option><option>Muted</option>
        </select>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>System Audio</h3>
        <select value={settings.systemAudio} onChange={(e) => updateSettings({ systemAudio: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
          <option>Default</option><option>Headphones</option><option>Speakers</option><option>Muted</option>
        </select>
      </div>
      {[
        { label: "Microphone Volume", key: "micVolume" as const },
        { label: "System Audio Volume", key: "systemVolume" as const },
      ].map(({ label, key }) => (
        <div key={key}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>{label}</h3>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="100" value={settings[key]} onChange={(e) => updateSettings({ [key]: Number(e.target.value) })} className="flex-1 accent-purple-600" />
            <span className="text-xs w-8 text-right" style={{ color: "var(--text-secondary)" }}>{settings[key]}%</span>
          </div>
        </div>
      ))}
      {[
        { label: "Noise Suppression", key: "noiseSuppression" as const },
        { label: "Echo Cancellation", key: "echoCancellation" as const },
      ].map(({ label, key }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
          <Toggle enabled={settings[key]} onChange={(v) => updateSettings({ [key]: v })} />
        </div>
      ))}
    </div>
  );
}

function ShortcutsSettings() {
  const { settings, updateShortcuts } = useSettings();
  const [listeningFor, setListeningFor] = useState<string | null>(null);

  useEffect(() => {
    if (!listeningFor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      const keyName = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (!parts.includes(keyName)) parts.push(keyName);
      updateShortcuts({ [listeningFor]: parts.join(" + ") });
      setListeningFor(null);
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [listeningFor, updateShortcuts]);

  const shortcutItems = [
    { key: "startStop" as const, label: "Start / Stop Recording" },
    { key: "pauseResume" as const, label: "Pause / Resume" },
    { key: "stop" as const, label: "Stop Recording" },
    { key: "mute" as const, label: "Mute / Unmute Mic" },
    { key: "screenshot" as const, label: "Take Screenshot" },
    { key: "showToolbar" as const, label: "Show / Hide Toolbar" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Keyboard Shortcuts</h3>
        <button onClick={() => updateShortcuts({ startStop: "Ctrl + Shift + R", pauseResume: "Ctrl + Shift + P", stop: "Ctrl + Shift + S", mute: "Ctrl + Shift + M", screenshot: "Ctrl + Shift + C", showToolbar: "Ctrl + Shift + T" })}
          className="px-3 py-1.5 rounded-lg border text-xs transition-colors" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>Reset to Default</button>
      </div>
      <div className="space-y-1">
        {shortcutItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-3 last:border-0" style={{ borderBottom: "1px solid var(--border-primary)" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors"
                style={{
                  backgroundColor: listeningFor === item.key ? "var(--accent-bg)" : "var(--bg-primary)",
                  borderColor: listeningFor === item.key ? "var(--accent-border)" : "var(--border-primary)",
                  color: listeningFor === item.key ? "var(--accent-text)" : "var(--text-secondary)",
                }}>
                {listeningFor === item.key ? "Press keys..." : settings.shortcuts[item.key]}
              </span>
              <button onClick={() => setListeningFor(item.key)} className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-muted)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings({ activeTab }: SettingsProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  useEffect(() => { setCurrentTab(activeTab); }, [activeTab]);

  const renderContent = () => {
    switch (currentTab) {
      case "general": return <GeneralSettings />;
      case "recording": return <RecordingSettings />;
      case "audio": return <AudioSettings />;
      case "shortcuts": return <ShortcutsSettings />;
      case "about": return (
        <div className="space-y-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5" /></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Screen Recorder</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Version 0.1.0</p>
            </div>
          </div>
          {[
            { label: "Developer", value: "Md. Robiul Alam" },
            { label: "License", value: "MIT" },
            { label: "Framework", value: "Tauri + React" },
            { label: "Platform", value: "Cross-Platform" },
          ].map(({ label, value }, i, arr) => (
            <div key={label} className="flex items-center justify-between py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-primary)" : "none" }}>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{value}</span>
            </div>
          ))}
        </div>
      );
      default: return <GeneralSettings />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-full">
      <div className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible p-2 sm:p-4 shrink-0" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <div className="flex sm:flex-col gap-1 w-full">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setCurrentTab(tab.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: currentTab === tab.id ? "var(--accent-bg)" : "transparent",
                color: currentTab === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-6 max-w-[500px] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
