const defaultShortcuts = [
  { id: "start", label: "Start / Stop Recording", keys: "Ctrl + Shift + R" },
  { id: "pause", label: "Pause / Resume", keys: "Ctrl + Shift + P" },
  { id: "stop", label: "Stop Recording", keys: "Ctrl + Shift + S" },
  { id: "mute", label: "Mute / Unmute Mic", keys: "Ctrl + Shift + M" },
  { id: "screenshot", label: "Take Screenshot", keys: "Ctrl + Shift + C" },
  { id: "toolbar", label: "Show / Hide Toolbar", keys: "Ctrl + Shift + T" },
];

export default function ShortcutsPage() {
  const shortcuts = defaultShortcuts;

  return (
    <div className="p-6 max-w-[600px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Shortcuts</h1>
        <button className="px-3 py-1.5 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-400 hover:text-white transition-colors">
          Reset to Default
        </button>
      </div>

      <div className="space-y-1">
        {shortcuts.map((sc) => (
          <div key={sc.id} className="flex items-center justify-between py-3 border-b border-[#1e1e2e] last:border-0">
            <span className="text-sm text-zinc-300">{sc.label}</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-[#0d0d14] border border-[#1e1e2e] text-xs text-zinc-400 font-mono">
                {sc.keys}
              </span>
              <button className="w-7 h-7 rounded-lg bg-[#16162a] border border-[#1e1e2e] flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
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
