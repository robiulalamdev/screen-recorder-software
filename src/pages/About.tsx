export default function About() {
  return (
    <div className="p-4 sm:p-6 w-full max-w-[500px]">
      <h1 className="text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>About</h1>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5" /></svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Screen Recorder</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Version 0.1.0</p>
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
      <p className="mt-8 text-xs text-center" style={{ color: "var(--text-muted)" }}>A lightweight, offline-first desktop screen recorder.</p>
    </div>
  );
}
