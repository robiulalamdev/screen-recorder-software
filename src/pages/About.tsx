export default function About() {
  return (
    <div className="p-4 sm:p-6 w-full max-w-[500px]">
      <h1 className="text-xl font-semibold mb-6 text-text-primary">About</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Screen Recorder</h2>
          <p className="text-sm text-text-muted">Version 0.1.0</p>
        </div>
      </div>

      <div className="space-y-0">
        {[
          { label: "Developer", value: "Md. Robiul Alam" },
          { label: "License", value: "MIT" },
          { label: "Framework", value: "Tauri + React" },
          { label: "Platform", value: "Cross-Platform" },
        ].map(({ label, value }, i, arr) => (
          <div key={label} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-border-primary" : ""}`}>
            <span className="text-sm text-text-muted">{label}</span>
            <span className="text-sm text-text-secondary">{value}</span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-text-muted text-center">
        A lightweight, offline-first desktop screen recorder.
      </p>
    </div>
  );
}
