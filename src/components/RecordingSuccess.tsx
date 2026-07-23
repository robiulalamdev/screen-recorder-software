interface RecordingSuccessProps {
  fileName: string;
  fileSize: string;
  duration: string;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onCopyPath: () => void;
  onDismiss: () => void;
}

export default function RecordingSuccess({
  fileName,
  fileSize,
  duration,
  onOpenFile,
  onOpenFolder,
  onCopyPath,
  onDismiss,
}: RecordingSuccessProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-5 shadow-2xl">
      {/* Close */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 w-6 h-6 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4 mb-5">
        {/* Success icon */}
        <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Recording Saved Successfully!</h3>
          <p className="text-xs text-zinc-400 mt-1">{fileName}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {fileSize} &middot; {duration}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onOpenFile}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#16162a] border border-[#2a2a3e] text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Open File
        </button>
        <button
          onClick={onOpenFolder}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#16162a] border border-[#2a2a3e] text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          </svg>
          Open Folder
        </button>
        <button
          onClick={onCopyPath}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#16162a] border border-[#2a2a3e] text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Path
        </button>
      </div>
    </div>
  );
}
