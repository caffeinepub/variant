import { useCallback, useEffect, useRef, useState } from "react";
import { prefGet, prefSet } from "./useCapacitorPreferences";
import { useCapacitorStorage } from "./useCapacitorStorage";

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
  const capStorage = useCapacitorStorage();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isLinked, setIsLinked] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize IndexedDB and restore persisted storage link state
  useEffect(() => {
    openDB()
      .then((db) => {
        dbRef.current = db;
      })
      .catch((e) => {
        console.warn("[useStorage] Failed to open IndexedDB:", e);
      });

    // Restore linked state from Capacitor Preferences
    prefGet("storageLinked").then((val) => {
      if (val === "true") {
        setIsLinked(true);
        setSyncStatus("synced");
      }
    });
  }, []);

  // Write to file using Capacitor Filesystem (or Blob download on web)
  const writeToFile = useCallback(
    async (payload: StoragePayload): Promise<boolean> => {
      if (!isLinked) return false;
      const jsonString = JSON.stringify(payload, null, 2);
      return capStorage.saveFileNative("variant-data.json", jsonString);
    },
    [isLinked, capStorage],
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

        // Layer 2: Capacitor Filesystem (native) or Blob download (web)
        if (isLinked) {
          const ok = await writeToFile(payload);
          setSyncStatus(ok ? "synced" : "error");
        } else {
          setSyncStatus("browser-only");
        }
      }, 2000);
    },
    [writeToFile, isLinked],
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

  // Link storage — no longer uses directory picker.
  // On native: marks as linked and persists to Preferences.
  // On web/Android PWA: same approach, saves will use Blob download.
  const linkFolder = useCallback(async (): Promise<boolean> => {
    try {
      await prefSet("storageLinked", "true");
      setIsLinked(true);
      setSyncStatus("synced");
      return true;
    } catch (e) {
      console.warn("[useStorage] linkFolder failed:", e);
      setSyncStatus("error");
      return false;
    }
  }, []);

  // Export backup as JSON Blob download (primary save mechanism on Android)
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
