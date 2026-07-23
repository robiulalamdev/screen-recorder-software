import { useState, useEffect, useCallback } from "react";

export interface Recording {
  id: string;
  name: string;
  duration: string;
  resolution: string;
  fps: string;
  size: string;
  date: string;
  path: string;
  createdAt: number;
}

const STORAGE_KEY = "screen-recorder-recordings";

function loadRecordings(): Recording[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveRecordings(recordings: Recording[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
}

export function useRecordings() {
  const [recordings, setRecordings] = useState<Recording[]>(loadRecordings);

  useEffect(() => {
    saveRecordings(recordings);
  }, [recordings]);

  const addRecording = useCallback((rec: Omit<Recording, "id" | "createdAt">) => {
    const newRec: Recording = {
      ...rec,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setRecordings((prev) => [newRec, ...prev]);
    return newRec;
  }, []);

  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const renameRecording = useCallback((id: string, newName: string) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
    );
  }, []);

  const duplicateRecording = useCallback((id: string) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (!rec) return prev;
      const dup: Recording = {
        ...rec,
        id: Date.now().toString(),
        name: rec.name.replace(".mp4", " (copy).mp4"),
        createdAt: Date.now(),
      };
      return [dup, ...prev];
    });
  }, []);

  return { recordings, addRecording, deleteRecording, renameRecording, duplicateRecording };
}
