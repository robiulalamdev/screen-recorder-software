export default function About() {
  return (
    <div className="p-6 max-w-[500px]">
      <h1 className="text-xl font-semibold mb-6">About</h1>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Screen Recorder</h2>
          <p className="text-sm text-zinc-500">Version 0.1.0</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-[#1e1e2e]">
          <span className="text-sm text-zinc-400">Developer</span>
          <span className="text-sm text-zinc-300">Md. Robiul Alam</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-[#1e1e2e]">
          <span className="text-sm text-zinc-400">License</span>
          <span className="text-sm text-zinc-300">MIT</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-[#1e1e2e]">
          <span className="text-sm text-zinc-400">Framework</span>
          <span className="text-sm text-zinc-300">Tauri + React</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-zinc-400">Platform</span>
          <span className="text-sm text-zinc-300">Cross-Platform</span>
        </div>
      </div>

      <p className="mt-8 text-xs text-zinc-600 text-center">
        A lightweight, offline-first desktop screen recorder.
      </p>
    </div>
  );
}
