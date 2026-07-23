import { useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useRecordings } from "../stores/recordingsStore";

export default function Recordings() {
  const { recordings, deleteRecording, renameRecording } = useRecordings();
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);

  const filtered = recordings
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return parseFloat(b.size) - parseFloat(a.size);
      return b.createdAt - a.createdAt; // date default (newest first)
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
    <div className="p-6" onClick={() => setContextMenu(null)}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Recordings</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search recordings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-48"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-400 outline-none"
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
            className="flex items-center gap-4 p-3 rounded-xl bg-[#16162a] border border-[#1e1e2e] hover:border-zinc-600 transition-colors cursor-pointer group"
            onContextMenu={(e) => handleContextMenu(e, rec.id)}
          >
            {/* Thumbnail */}
            <div className="w-24 h-14 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{rec.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {rec.duration} &middot; {rec.resolution} &middot; {rec.fps}
              </p>
            </div>

            {/* Size & Date */}
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-400">{rec.size}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{rec.date}</p>
            </div>

            {/* Play */}
            <button
              onClick={() => {
                setPlayingSrc(rec.path);
              }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            {/* More */}
            <button
              onClick={(e) => handleContextMenu(e, rec.id)}
              className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-1.5 shadow-2xl min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { id: "open", label: "Open", icon: "play" },
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
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-zinc-300 hover:bg-white/5"
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
              {item.icon === "play" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            <rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>
          <p className="text-sm">No recordings found</p>
        </div>
      )}

      {/* Video Player */}
      {playingSrc && (
        <VideoPlayer
          src={playingSrc}
          onClose={() => setPlayingSrc(null)}
        />
      )}
    </div>
  );
}
