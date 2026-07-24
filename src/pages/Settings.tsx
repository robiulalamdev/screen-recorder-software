import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "../stores/settingsStore";

interface SettingsProps {
  activeTab: string;
}

const tabs = [
  { id: "general", label: "General", icon: "gear" },
  { id: "recording", label: "Recording", icon: "record" },
  { id: "audio", label: "Audio", icon: "audio" },
  { id: "shortcuts", label: "Shortcuts", icon: "shortcuts" },
  { id: "about", label: "About", icon: "about" },
];

function TabIcon({ icon }: { icon: string }) {
  const cls = "w-4 h-4";
  switch (icon) {
    case "gear":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "record":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>;
    case "audio":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>;
    case "shortcuts":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.001" /><path d="M10 8h.001" /><path d="M14 8h.001" /><path d="M6 12h.001" /><path d="M10 12h.001" /><path d="M14 12h.001" /><path d="M6 16h12" /></svg>;
    case "about":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
    default:
      return null;
  }
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)} className={`w-10 h-[22px] rounded-full p-0.5 transition-colors shrink-0 ${enabled ? "bg-accent" : "bg-bg-elevated"}`}>
      <div className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

function GeneralSettings() {
  const { settings, updateSettings } = useSettings();

  const handleSelectFolder = async () => {
    try {
      const folder = await invoke<string>("select_folder");
      if (folder) updateSettings({ saveLocation: folder });
    } catch (err) {
      console.error("Failed to select folder:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Save Location</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border-primary text-sm text-text-secondary truncate">
            {settings.saveLocation}
          </div>
          <button onClick={handleSelectFolder}
            className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-sm text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >Change</button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Video Name Format</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border-primary text-sm text-text-secondary font-mono">
            {settings.videoNameFormat}
          </div>
          <button
            onClick={() => { const fmt = prompt("Enter name format:", settings.videoNameFormat); if (fmt) updateSettings({ videoNameFormat: fmt }); }}
            className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-sm text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >Change</button>
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
            <span className="text-sm text-text-secondary">{label}</span>
            <Toggle enabled={settings[key]} onChange={(v) => updateSettings({ [key]: v })} />
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Theme</h3>
        <div className="flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <button key={t} onClick={() => updateSettings({ theme: t })}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                settings.theme === t
                  ? "bg-accent-bg border border-accent-border text-accent-text"
                  : "bg-bg-tertiary border border-border-primary text-text-secondary hover:text-text-primary"
              }`}>
              {t === "dark" && <span className="inline-block w-2 h-2 rounded-full bg-accent-text mr-1.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Language</h3>
        <select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value })}
          className="w-48 px-3 py-2 rounded-lg bg-bg-primary border border-border-primary text-sm text-text-secondary outline-none">
          <option>English</option>
        </select>
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
          <h3 className="text-sm font-medium text-text-primary mb-3">{label}</h3>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button key={opt} onClick={() => updateSettings({ [key]: opt })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings[key] === opt
                    ? "bg-accent-bg border border-accent-border text-accent-text"
                    : "bg-bg-tertiary border border-border-primary text-text-secondary hover:text-text-primary"
                } ${uppercase ? "uppercase" : ""}`}>
                {opt}{suffix}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-text-secondary">Enable Countdown</span>
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
        <h3 className="text-sm font-medium text-text-primary mb-3">Microphone</h3>
        <select value={settings.microphone} onChange={(e) => updateSettings({ microphone: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border-primary text-sm text-text-secondary outline-none">
          <option>Default</option><option>USB Microphone</option><option>Bluetooth Microphone</option><option>Muted</option>
        </select>
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">System Audio</h3>
        <select value={settings.systemAudio} onChange={(e) => updateSettings({ systemAudio: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border-primary text-sm text-text-secondary outline-none">
          <option>Default</option><option>Headphones</option><option>Speakers</option><option>Muted</option>
        </select>
      </div>
      {[
        { label: "Microphone Volume", key: "micVolume" as const },
        { label: "System Audio Volume", key: "systemVolume" as const },
      ].map(({ label, key }) => (
        <div key={key}>
          <h3 className="text-sm font-medium text-text-primary mb-3">{label}</h3>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="100" value={settings[key]}
              onChange={(e) => updateSettings({ [key]: Number(e.target.value) })}
              className="flex-1 accent-[var(--accent)]" />
            <span className="text-xs text-text-secondary w-8 text-right">{settings[key]}%</span>
          </div>
        </div>
      ))}
      {[
        { label: "Noise Suppression", key: "noiseSuppression" as const },
        { label: "Echo Cancellation", key: "echoCancellation" as const },
      ].map(({ label, key }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="text-sm text-text-secondary">{label}</span>
          <Toggle enabled={settings[key]} onChange={(v) => updateSettings({ [key]: v })} />
        </div>
      ))}
    </div>
  );
}

function ShortcutsSettings() {
  const { settings, updateShortcuts } = useSettings();
  const [listeningFor, setListeningFor] = useState<string | null>(null);

  const shortcutItems = [
    { key: "startStop" as const, label: "Start / Stop Recording" },
    { key: "pauseResume" as const, label: "Pause / Resume" },
    { key: "stop" as const, label: "Stop Recording" },
    { key: "mute" as const, label: "Mute / Unmute Mic" },
    { key: "screenshot" as const, label: "Take Screenshot" },
    { key: "showToolbar" as const, label: "Show / Hide Toolbar" },
  ];

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">Keyboard Shortcuts</h3>
        <button onClick={() => updateShortcuts({ startStop: "Ctrl + Shift + R", pauseResume: "Ctrl + Shift + P", stop: "Ctrl + Shift + S", mute: "Ctrl + Shift + M", screenshot: "Ctrl + Shift + C", showToolbar: "Ctrl + Shift + T" })}
          className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-primary text-xs text-text-secondary hover:text-text-primary transition-colors">
          Reset to Default
        </button>
      </div>
      <div className="space-y-1">
        {shortcutItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border-primary last:border-0">
            <span className="text-sm text-text-secondary">{item.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                listeningFor === item.key
                  ? "bg-accent-bg border-accent-border text-accent-text animate-pulse"
                  : "bg-bg-primary border-border-primary text-text-secondary"
              }`}>
                {listeningFor === item.key ? "Press keys..." : settings.shortcuts[item.key]}
              </span>
              <button onClick={() => setListeningFor(item.key)}
                className="w-7 h-7 rounded-lg bg-bg-tertiary border border-border-primary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
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
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5" /></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Screen Recorder</h2>
              <p className="text-xs text-text-muted">Version 0.1.0</p>
            </div>
          </div>
          {[
            { label: "Developer", value: "Md. Robiul Alam" },
            { label: "License", value: "MIT" },
            { label: "Framework", value: "Tauri + React" },
            { label: "Platform", value: "Cross-Platform" },
          ].map(({ label, value }, i) => (
            <div key={label} className={`flex items-center justify-between py-3 ${i < 3 ? "border-b border-border-primary" : ""}`}>
              <span className="text-sm text-text-muted">{label}</span>
              <span className="text-sm text-text-secondary">{value}</span>
            </div>
          ))}
        </div>
      );
      default: return <GeneralSettings />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-full">
      {/* Tab bar — horizontal on mobile, vertical on desktop */}
      <div className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible border-b sm:border-b-0 sm:border-r border-border-primary p-2 sm:p-4 shrink-0">
        <div className="flex sm:flex-col gap-1 w-full">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                currentTab === tab.id ? "bg-accent-bg text-accent-text" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}>
              <span className={currentTab === tab.id ? "text-accent-text" : "text-text-muted"}>
                <TabIcon icon={tab.icon} />
              </span>
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
