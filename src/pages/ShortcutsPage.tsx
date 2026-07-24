const defaultShortcuts = [
  { id: "start", label: "Start / Stop Recording", keys: "Ctrl + Shift + R" },
  { id: "pause", label: "Pause / Resume", keys: "Ctrl + Shift + P" },
  { id: "stop", label: "Stop Recording", keys: "Ctrl + Shift + S" },
  { id: "mute", label: "Mute / Unmute Mic", keys: "Ctrl + Shift + M" },
  { id: "screenshot", label: "Take Screenshot", keys: "Ctrl + Shift + C" },
  { id: "toolbar", label: "Show / Hide Toolbar", keys: "Ctrl + Shift + T" },
];

export default function ShortcutsPage() {
  return (
    <div className="p-4 sm:p-6 w-full max-w-[600px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Shortcuts</h1>
        <button className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-primary text-sm text-text-secondary hover:text-text-primary transition-colors">
          Reset to Default
        </button>
      </div>

      <div className="space-y-1">
        {defaultShortcuts.map((sc) => (
          <div key={sc.id} className="flex items-center justify-between gap-4 py-3 border-b border-border-primary last:border-0">
            <span className="text-sm text-text-secondary">{sc.label}</span>
            <span className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border-primary text-xs text-text-secondary font-mono shrink-0">
              {sc.keys}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
