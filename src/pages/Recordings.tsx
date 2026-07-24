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

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleAction = (action: string, rec: { id: string; name: string; path: string }) => {
    setContextMenu(null);
    switch (action) {
      case "delete":
        deleteRecording(rec.id);
        break;
      case "copyPath":
        navigator.clipboard?.writeText(rec.path);
        break;
      case "rename": {
        const newName = prompt("Rename recording:", rec.name);
        if (newName) renameRecording(rec.id, newName);
        break;
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full" onClick={() => setContextMenu(null)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Recordings</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search recordings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-full sm:w-48"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-sm text-text-secondary outline-none shrink-0"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-bg-tertiary border border-border-primary hover:border-border-secondary transition-colors cursor-pointer group"
            onContextMenu={(e) => handleContextMenu(e, rec.id)}
          >
            {/* Thumbnail — hidden on small screens */}
            <div className="hidden sm:flex w-24 h-14 rounded-lg bg-bg-elevated items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{rec.name}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {rec.duration} &middot; {rec.resolution} &middot; {rec.fps}
              </p>
            </div>

            {/* Size & Date — hidden on small screens */}
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs text-text-secondary">{rec.size}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{rec.date}</p>
            </div>

            {/* Play */}
            <button
              onClick={() => { /* open video */ }}
              className="w-8 h-8 rounded-full bg-bg-elevated hover:bg-bg-tertiary flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            {/* More */}
            <button
              onClick={(e) => handleContextMenu(e, rec.id)}
              className="w-8 h-8 rounded-full hover:bg-bg-elevated flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-bg-elevated border border-border-secondary rounded-xl p-1.5 shadow-2xl min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { id: "rename", label: "Rename", icon: "edit" },
            { id: "copyPath", label: "Copy Path", icon: "copy" },
            { id: "delete", label: "Delete", icon: "trash" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const rec = recordings.find((r) => r.id === contextMenu.id);
                if (rec) handleAction(item.id, rec);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.id === "delete"
                  ? "text-danger-text hover:bg-danger-bg"
                  : "text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {item.icon === "trash" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              )}
              {item.icon === "edit" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              )}
              {item.icon === "copy" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            <rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>
          <p className="text-sm">No recordings found</p>
        </div>
      )}
    </div>
  );
}
