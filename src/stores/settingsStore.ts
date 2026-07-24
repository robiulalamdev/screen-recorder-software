import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  // General
  saveLocation: string;
  autoCreateFolders: boolean;
  autoOpenFolder: boolean;
  minimizeToTray: boolean;
  launchOnStartup: boolean;
  startMinimized: boolean;
  videoNameFormat: string;
  theme: "dark" | "light" | "system";
  language: string;

  // Recording
  videoQuality: "low" | "medium" | "high" | "ultra";
  frameRate: 24 | 30 | 60;
  resolution: "original" | "1080p" | "1440p" | "4k";
  encoder: "h264" | "h265" | "av1";
  outputFormat: "mp4" | "webm" | "mkv";
  countdownEnabled: boolean;

  // Audio
  microphone: string;
  systemAudio: string;
  micVolume: number;
  systemVolume: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;

  // Shortcuts
  shortcuts: {
    startStop: string;
    pauseResume: string;
    stop: string;
    mute: string;
    screenshot: string;
    showToolbar: string;
  };
}

// Get default save location from Rust backend
let defaultSaveLocation = "~/Downloads/ScreenRecorder";
invoke<string>("get_downloads_dir").then((dir) => {
  defaultSaveLocation = `${dir}/ScreenRecorder`;
}).catch(() => {});

const defaultSettings: AppSettings = {
  saveLocation: defaultSaveLocation,
  autoCreateFolders: true,
  autoOpenFolder: false,
  minimizeToTray: true,
  launchOnStartup: false,
  startMinimized: false,
  videoNameFormat: "Recording_{YYYY}-{MM}-{DD}_{HH}-{mm}-{ss}",
  theme: "dark",
  language: "English",
  videoQuality: "high",
  frameRate: 60,
  resolution: "original",
  encoder: "h264",
  outputFormat: "mp4",
  countdownEnabled: true,
  microphone: "Default",
  systemAudio: "Default",
  micVolume: 80,
  systemVolume: 70,
  noiseSuppression: false,
  echoCancellation: false,
  shortcuts: {
    startStop: "Ctrl + Shift + R",
    pauseResume: "Ctrl + Shift + P",
    stop: "Ctrl + Shift + S",
    mute: "Ctrl + Shift + M",
    screenshot: "Ctrl + Shift + C",
    showToolbar: "Ctrl + Shift + T",
  },
};

const STORAGE_KEY = "screen-recorder-settings";

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateShortcuts = useCallback((partial: Partial<AppSettings["shortcuts"]>) => {
    setSettings((prev) => ({
      ...prev,
      shortcuts: { ...prev.shortcuts, ...partial },
    }));
  }, []);

  return { settings, updateSettings, updateShortcuts };
}
