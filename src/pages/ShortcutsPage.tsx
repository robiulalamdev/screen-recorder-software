const shortcuts = [
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
      <h1 className="text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Shortcuts</h1>
      <div className="space-y-1">
        {shortcuts.map((sc, i, arr) => (
          <div key={sc.id} className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-primary)" : "none" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{sc.label}</span>
            <span className="px-3 py-1.5 rounded-lg border text-xs font-mono shrink-0" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
              {sc.keys}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
