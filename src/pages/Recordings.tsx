import { useState } from "react";
import { useRecordings } from "../stores/recordingsStore";

export default function Recordings() {
  const { recordings, deleteRecording, renameRecording } = useRecordings();
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const filtered = recordings
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return parseFloat(b.size) - parseFloat(a.size);
      return b.createdAt - a.createdAt;
    });

  return (
    <div className="p-4 sm:p-6 w-full" onClick={() => setContextMenu(null)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Recordings</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style={{ color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full sm:w-48" style={{ color: "var(--text-primary)" }} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none shrink-0" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
            <option value="date">Date</option><option value="name">Name</option><option value="size">Size</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((rec) => (
          <div key={rec.id}
            className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border transition-colors group"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ id: rec.id, x: e.clientX, y: e.clientY }); }}>
            <div className="hidden sm:flex w-24 h-14 rounded-lg items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-elevated)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{rec.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{rec.duration} &middot; {rec.resolution} &middot; {rec.fps}</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{rec.size}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{rec.date}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setContextMenu({ id: rec.id, x: e.clientX, y: e.clientY }); }}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div className="fixed z-50 rounded-xl p-1.5 shadow-2xl min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y, backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-secondary)" }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { id: "rename", label: "Rename" },
            { id: "copyPath", label: "Copy Path" },
            { id: "delete", label: "Delete" },
          ].map((item) => (
            <button key={item.id}
              onClick={() => {
                const rec = recordings.find((r) => r.id === contextMenu.id);
                if (rec) {
                  setContextMenu(null);
                  if (item.id === "delete") deleteRecording(rec.id);
                  else if (item.id === "copyPath") navigator.clipboard?.writeText(rec.path);
                  else if (item.id === "rename") { const n = prompt("Rename:", rec.name); if (n) renameRecording(rec.id, n); }
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: item.id === "delete" ? "var(--danger-text)" : "var(--text-secondary)" }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>
          <p className="text-sm">No recordings found</p>
        </div>
      )}
    </div>
  );
}
