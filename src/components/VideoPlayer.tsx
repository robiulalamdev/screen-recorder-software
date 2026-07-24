import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface VideoPlayerProps {
  src: string;
  onClose: () => void;
}

export default function VideoPlayer({ src, onClose }: VideoPlayerProps) {
  // Open video in the system's default player (QuickTime, IINA, etc.)
  useEffect(() => {
    if (src) {
      invoke("open_file", { path: src }).catch(console.error);
      onClose();
    }
  }, [src, onClose]);

  return null;
}
