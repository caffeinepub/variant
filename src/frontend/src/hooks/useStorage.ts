import { useCallback, useEffect, useRef, useState } from "react";

export type SyncStatus = "idle" | "synced" | "browser-only" | "error";

const DB_NAME = "variant-app";
const DB_VERSION = 1;
const STORE_NAME = "app-data";
const DATA_KEY = "variant-app-data";

// --- IndexedDB helpers ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db: IDBDatabase, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export interface StoragePayload {
  questions: any[];
  lastModified: string;
}

export function useStorage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isLinked, setIsLinked] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize IndexedDB on mount
  useEffect(() => {
    openDB()
      .then((db) => {
        dbRef.current = db;
      })
      .catch((e) => {
        console.warn("[useStorage] Failed to open IndexedDB:", e);
      });
  }, []);

  // Write to local file in linked folder
  const writeToFile = useCallback(
    async (payload: StoragePayload): Promise<boolean> => {
      if (!dirHandleRef.current) return false;
      try {
        const fileHandle = await dirHandleRef.current.getFileHandle(
          "variant-data.json",
          { create: true },
        );
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
        return true;
      } catch (e) {
        console.warn("[useStorage] File write failed:", e);
        return false;
      }
    },
    [],
  );

  // Core save — debounced 2s
  const saveData = useCallback(
    (data: any[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        // Anti-corruption: never save empty
        if (!data || data.length === 0) {
          console.warn(
            "[useStorage] Aborted save: data is empty. No overwrite performed.",
          );
          return;
        }

        const payload: StoragePayload = {
          questions: data,
          lastModified: new Date().toISOString(),
        };

        // Layer 1: IndexedDB
        if (dbRef.current) {
          try {
            await idbSet(dbRef.current, DATA_KEY, payload);
          } catch (e) {
            console.warn("[useStorage] IndexedDB write failed:", e);
          }
        }

        // Layer 2: File System
        if (dirHandleRef.current) {
          const ok = await writeToFile(payload);
          setSyncStatus(ok ? "synced" : "error");
        } else {
          setSyncStatus("browser-only");
        }
      }, 2000);
    },
    [writeToFile],
  );

  // Load from IndexedDB on mount
  const loadData = useCallback(async (): Promise<StoragePayload | null> => {
    const db = dbRef.current;
    if (!db) {
      // DB not ready yet — try to open inline
      try {
        const freshDb = await openDB();
        dbRef.current = freshDb;
        const stored = await idbGet(freshDb, DATA_KEY);
        return stored ?? null;
      } catch {
        return null;
      }
    }
    try {
      const stored = await idbGet(db, DATA_KEY);
      return stored ?? null;
    } catch {
      return null;
    }
  }, []);

  // Link a local folder via File System Access API
  const linkFolder = useCallback(async (): Promise<boolean> => {
    if (!("showDirectoryPicker" in window)) {
      console.warn("[useStorage] File System Access API not supported.");
      setSyncStatus("error");
      return false;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });
      dirHandleRef.current = handle;
      setIsLinked(true);
      setSyncStatus("synced");
      return true;
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.warn("[useStorage] Directory picker error:", e);
        setSyncStatus("error");
      }
      return false;
    }
  }, []);

  // Export backup as JSON download
  const exportBackup = useCallback(async (data: any[]): Promise<void> => {
    const payload: StoragePayload = {
      questions: data,
      lastModified: new Date().toISOString(),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `variant-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import backup from JSON file
  const importBackup = useCallback(async (): Promise<StoragePayload | null> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async () => {
        if (!input.files?.[0]) {
          resolve(null);
          return;
        }
        try {
          const text = await input.files[0].text();
          const parsed = JSON.parse(text);
          resolve(parsed);
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  }, []);

  return {
    syncStatus,
    isLinked,
    linkFolder,
    saveData,
    loadData,
    exportBackup,
    importBackup,
  };
}
