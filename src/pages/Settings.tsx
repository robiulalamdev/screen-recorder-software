import { useState } from "react";
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
    <button onClick={() => onChange(!enabled)} className={`w-10 h-[22px] rounded-full p-0.5 transition-colors ${enabled ? "bg-purple-500" : "bg-zinc-700"}`}>
      <div className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

function GeneralSettings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Save Location</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-400 truncate">
            {settings.saveLocation}
          </div>
          <button
            onClick={() => {
              const loc = prompt("Enter save location:", settings.saveLocation);
              if (loc) updateSettings({ saveLocation: loc });
            }}
            className="px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-300 hover:text-white transition-colors"
          >Change</button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Video Name Format</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-400 font-mono">
            {settings.videoNameFormat}
          </div>
          <button
            onClick={() => {
              const fmt = prompt("Enter name format:", settings.videoNameFormat);
              if (fmt) updateSettings({ videoNameFormat: fmt });
            }}
            className="px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-300 hover:text-white transition-colors"
          >Change</button>
        </div>
        <p className="text-[11px] text-zinc-500 mt-1.5">Available: {"{YYYY}"} {"{MM}"} {"{DD}"} {"{HH}"} {"{mm}"} {"{ss}"}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Auto create folders by Year/Month</span>
          <Toggle enabled={settings.autoCreateFolders} onChange={(v) => updateSettings({ autoCreateFolders: v })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Auto open folder after recording</span>
          <Toggle enabled={settings.autoOpenFolder} onChange={(v) => updateSettings({ autoOpenFolder: v })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Minimize to system tray</span>
          <Toggle enabled={settings.minimizeToTray} onChange={(v) => updateSettings({ minimizeToTray: v })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Launch on startup</span>
          <Toggle enabled={settings.launchOnStartup} onChange={(v) => updateSettings({ launchOnStartup: v })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Start minimized</span>
          <Toggle enabled={settings.startMinimized} onChange={(v) => updateSettings({ startMinimized: v })} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Theme</h3>
        <div className="flex gap-2">
          {(["dark", "light", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSettings({ theme: t })}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                settings.theme === t
                  ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                  : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"
              }`}
            >
              {t === "dark" && <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Language</h3>
        <select
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="w-48 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-300 outline-none"
        >
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
      <div>
        <h3 className="text-sm font-medium mb-3">Video Quality</h3>
        <div className="flex gap-2">
          {(["low", "medium", "high", "ultra"] as const).map((q) => (
            <button key={q} onClick={() => updateSettings({ videoQuality: q })}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${settings.videoQuality === q ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {q}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Frame Rate</h3>
        <div className="flex gap-2">
          {([24, 30, 60] as const).map((f) => (
            <button key={f} onClick={() => updateSettings({ frameRate: f })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settings.frameRate === f ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {f} FPS
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Resolution</h3>
        <div className="flex gap-2">
          {(["original", "1080p", "1440p", "4k"] as const).map((r) => (
            <button key={r} onClick={() => updateSettings({ resolution: r })}
              className={`px-4 py-2 rounded-lg text-sm font-medium uppercase transition-colors ${settings.resolution === r ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Encoder</h3>
        <div className="flex gap-2">
          {(["h264", "h265", "av1"] as const).map((e) => (
            <button key={e} onClick={() => updateSettings({ encoder: e })}
              className={`px-4 py-2 rounded-lg text-sm font-medium uppercase transition-colors ${settings.encoder === e ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Output Format</h3>
        <div className="flex gap-2">
          {(["mp4", "webm", "mkv"] as const).map((f) => (
            <button key={f} onClick={() => updateSettings({ outputFormat: f })}
              className={`px-4 py-2 rounded-lg text-sm font-medium uppercase transition-colors ${settings.outputFormat === f ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">Enable Countdown</span>
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
        <h3 className="text-sm font-medium mb-3">Microphone</h3>
        <select value={settings.microphone} onChange={(e) => updateSettings({ microphone: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-300 outline-none">
          <option>Default</option><option>USB Microphone</option><option>Bluetooth Microphone</option><option>Muted</option>
        </select>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">System Audio</h3>
        <select value={settings.systemAudio} onChange={(e) => updateSettings({ systemAudio: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-300 outline-none">
          <option>Default</option><option>Headphones</option><option>Speakers</option><option>Muted</option>
        </select>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Microphone Volume</h3>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="100" value={settings.micVolume}
            onChange={(e) => updateSettings({ micVolume: Number(e.target.value) })}
            className="flex-1 accent-purple-500" />
          <span className="text-xs text-zinc-400 w-8 text-right">{settings.micVolume}%</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">System Audio Volume</h3>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="100" value={settings.systemVolume}
            onChange={(e) => updateSettings({ systemVolume: Number(e.target.value) })}
            className="flex-1 accent-purple-500" />
          <span className="text-xs text-zinc-400 w-8 text-right">{settings.systemVolume}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">Noise Suppression</span>
        <Toggle enabled={settings.noiseSuppression} onChange={(v) => updateSettings({ noiseSuppression: v })} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">Echo Cancellation</span>
        <Toggle enabled={settings.echoCancellation} onChange={(v) => updateSettings({ echoCancellation: v })} />
      </div>
    </div>
  );
}

function ShortcutsSettings() {
  const { settings, updateShortcuts } = useSettings();

  const shortcutItems = [
    { key: "startStop" as const, label: "Start / Stop Recording" },
    { key: "pauseResume" as const, label: "Pause / Resume" },
    { key: "stop" as const, label: "Stop Recording" },
    { key: "mute" as const, label: "Mute / Unmute Mic" },
    { key: "screenshot" as const, label: "Take Screenshot" },
    { key: "showToolbar" as const, label: "Show / Hide Toolbar" },
  ];

  return (
    <div className="space-y-1">
      {shortcutItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b border-[#1e1e2e] last:border-0">
          <span className="text-sm text-zinc-300">{item.label}</span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-xs text-zinc-400 font-mono">
              {settings.shortcuts[item.key]}
            </span>
            <button
              onClick={() => {
                const newKey = prompt(`Set shortcut for ${item.label}:`, settings.shortcuts[item.key]);
                if (newKey) updateShortcuts({ [item.key]: newKey });
              }}
              className="w-7 h-7 rounded-lg bg-[#16162a] border border-[#1e1e2e] flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Settings({ activeTab }: SettingsProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Sync with external tab changes
  if (currentTab !== activeTab) {
    setCurrentTab(activeTab);
  }

  const renderContent = () => {
    switch (currentTab) {
      case "general": return <GeneralSettings />;
      case "recording": return <RecordingSettings />;
      case "audio": return <AudioSettings />;
      case "shortcuts": return <ShortcutsSettings />;
      default: return <GeneralSettings />;
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-[180px] border-r border-[#1e1e2e] p-4 shrink-0">
        <h2 className="text-sm font-semibold mb-4">Settings</h2>
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === tab.id ? "bg-purple-500/15 text-purple-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}>
              <span className={currentTab === tab.id ? "text-purple-400" : "text-zinc-500"}>
                <TabIcon icon={tab.icon} />
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 max-w-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}
