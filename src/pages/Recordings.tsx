import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useRecordings } from "../stores/recordingsStore";

function VideoThumbnail({ path }: { path: string }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    invoke<string>("generate_thumbnail", { videoPath: path })
      .then((p) => setThumb(`https://asset.localhost/${encodeURIComponent(p)}`))
      .catch(() => {});
  }, [path]);

  if (thumb) {
    return <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  );
}

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
            {/* Video Thumbnail */}
            <div className="w-24 h-14 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--bg-elevated)" }}>
              <VideoThumbnail path={rec.path} />
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

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 rounded-xl p-1.5 shadow-2xl min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y, backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-secondary)" }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { id: "rename", label: "Rename", icon: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" },
            { id: "copyPath", label: "Copy Path", icon: "M9 9h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" },
            { id: "open", label: "Open File", icon: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" },
            { id: "openFolder", label: "Show in Finder", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
          ].map((item) => (
            <button key={item.id}
              onClick={() => {
                const rec = recordings.find((r) => r.id === contextMenu.id);
                if (!rec) return;
                setContextMenu(null);
                if (item.id === "rename") { const n = prompt("Rename:", rec.name); if (n) renameRecording(rec.id, n); }
                else if (item.id === "copyPath") navigator.clipboard?.writeText(rec.path);
                else if (item.id === "open") invoke("open_file", { path: rec.path }).catch(console.error);
                else if (item.id === "openFolder") invoke("open_folder", { path: rec.path }).catch(console.error);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-bg-hover"
              style={{ color: "var(--text-secondary)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
          <div style={{ height: "1px", backgroundColor: "var(--border-primary)", margin: "4px 0" }} />
          <button
            onClick={() => {
              const rec = recordings.find((r) => r.id === contextMenu.id);
              if (rec) { setContextMenu(null); deleteRecording(rec.id); }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-bg-hover"
            style={{ color: "var(--danger-text)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete
          </button>
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
