import { useState } from "react";

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

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${enabled ? "bg-purple-500" : "bg-zinc-700"}`}>
      <div className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-0"}`} />
    </div>
  );
}

function GeneralSettings() {
  const [autoFolders, setAutoFolders] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);
  const [minTray, setMinTray] = useState(true);
  const [launchStartup, setLaunchStartup] = useState(false);
  const [theme, setTheme] = useState("dark");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Save Location</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-400 truncate">
            C:\Users\Robiul Alam\Downloads\ScreenRecorder
          </div>
          <button className="px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-300 hover:text-white transition-colors">Change</button>
          <button className="px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-300 hover:text-white transition-colors">Open</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Auto create folders by Year/Month</span>
          <button onClick={() => setAutoFolders(!autoFolders)}><Toggle enabled={autoFolders} /></button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Auto open folder after recording</span>
          <button onClick={() => setAutoOpen(!autoOpen)}><Toggle enabled={autoOpen} /></button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Minimize to system tray</span>
          <button onClick={() => setMinTray(!minTray)}><Toggle enabled={minTray} /></button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Launch on startup</span>
          <button onClick={() => setLaunchStartup(!launchStartup)}><Toggle enabled={launchStartup} /></button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Theme</h3>
        <div className="flex gap-2">
          {["dark", "light", "system"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                theme === t
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
        <select className="w-48 px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-300 outline-none">
          <option>English</option>
        </select>
      </div>
    </div>
  );
}

function RecordingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Video Quality</h3>
        <div className="flex gap-2">
          {["Low", "Medium", "High", "Ultra"].map((q, i) => (
            <button key={q} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 2 ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {q}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Frame Rate</h3>
        <div className="flex gap-2">
          {["24 FPS", "30 FPS", "60 FPS"].map((f, i) => (
            <button key={f} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 2 ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Resolution</h3>
        <div className="flex gap-2">
          {["Original", "1080P", "1440P", "4K"].map((r, i) => (
            <button key={r} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Encoder</h3>
        <div className="flex gap-2">
          {["H264", "H265", "AV1"].map((e, i) => (
            <button key={e} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Output Format</h3>
        <div className="flex gap-2">
          {["MP4", "WebM", "MKV"].map((f, i) => (
            <button key={f} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#16162a] border border-[#1e1e2e] text-zinc-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AudioSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Microphone</h3>
        <select className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-300 outline-none">
          <option>Default</option>
          <option>USB Microphone</option>
          <option>Bluetooth Microphone</option>
        </select>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">System Audio</h3>
        <select className="w-full px-3 py-2 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-sm text-zinc-300 outline-none">
          <option>Default</option>
          <option>Headphones</option>
          <option>Speakers</option>
        </select>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Microphone Volume</h3>
        <input type="range" min="0" max="100" defaultValue="80" className="w-full accent-purple-500" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">System Audio Volume</h3>
        <input type="range" min="0" max="100" defaultValue="70" className="w-full accent-purple-500" />
      </div>
    </div>
  );
}

export default function Settings({ activeTab }: SettingsProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const renderContent = () => {
    switch (currentTab) {
      case "general": return <GeneralSettings />;
      case "recording": return <RecordingSettings />;
      case "audio": return <AudioSettings />;
      default: return <GeneralSettings />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Settings Nav */}
      <div className="w-[180px] border-r border-[#1e1e2e] p-4 shrink-0">
        <h2 className="text-sm font-semibold mb-4">Settings</h2>
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? "bg-purple-500/15 text-purple-400"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={currentTab === tab.id ? "text-purple-400" : "text-zinc-500"}>
                <TabIcon icon={tab.icon} />
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 max-w-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}
