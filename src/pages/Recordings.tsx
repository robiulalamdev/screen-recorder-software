const recordings = [
  { id: "1", name: "Project Demo.mp4", duration: "00:12:45", resolution: "1920x1080", fps: "60 FPS", size: "23.8 MB", date: "Today, 10:30 AM" },
  { id: "2", name: "UI Design Review.mp4", duration: "00:08:19", resolution: "1920x1080", fps: "60 FPS", size: "15.6 MB", date: "Today, 09:15 AM" },
  { id: "3", name: "Bug Fix Walkthrough.mp4", duration: "00:17:32", resolution: "2560x1440", fps: "60 FPS", size: "35.7 MB", date: "Yesterday, 04:20 PM" },
  { id: "4", name: "Feature Explanation.mp4", duration: "00:06:51", resolution: "1920x1080", fps: "30 FPS", size: "11.3 MB", date: "Yesterday, 11:10 AM" },
  { id: "5", name: "API Integration Guide.mp4", duration: "00:22:10", resolution: "1920x1080", fps: "30 FPS", size: "42.5 MB", date: "22 Jul, 03:45 PM" },
  { id: "6", name: "Code Review Session.mp4", duration: "00:15:03", resolution: "2560x1440", fps: "60 FPS", size: "38.2 MB", date: "21 Jul, 02:15 PM" },
];

export default function Recordings() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Recordings</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Search recordings..." className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-48" />
          </div>
          <select className="px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e2e] text-sm text-zinc-400 outline-none">
            <option>Sort by Date</option>
            <option>Sort by Name</option>
            <option>Sort by Size</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {recordings.map((rec) => (
          <div key={rec.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#16162a] border border-[#1e1e2e] hover:border-zinc-600 transition-colors cursor-pointer group">
            <div className="w-24 h-14 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{rec.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {rec.duration} &middot; {rec.resolution} &middot; {rec.fps}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-400">{rec.size}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{rec.date}</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
