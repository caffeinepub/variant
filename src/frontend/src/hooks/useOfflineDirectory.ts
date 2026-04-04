import { useCallback, useEffect, useRef, useState } from "react";

// IndexedDB keys for storing the directory handle
const IDB_KEY = "offline-dir-handle";
const IDB_STORE = "offline-dir-store";
const IDB_DB = "variant-offline-dir";

// Extended types for File System Access API (not in all TS libs)
interface FSDirectoryHandle {
  name: string;
  queryPermission: (opts: { mode: string }) => Promise<PermissionState>;
  requestPermission: (opts: { mode: string }) => Promise<PermissionState>;
  getFileHandle: (
    name: string,
    opts?: { create?: boolean },
  ) => Promise<FSFileHandle>;
}

interface FSFileHandle {
  createWritable: () => Promise<FSWritable>;
}

interface FSWritable {
  write: (content: string | BufferSource | Blob) => Promise<void>;
  close: () => Promise<void>;
}

// Minimal IndexedDB helpers
function openDirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getSavedHandle(): Promise<FSDirectoryHandle | null> {
  try {
    const db = await openDirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as FSDirectoryHandle) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function persistHandle(handle: FSDirectoryHandle): Promise<void> {
  const db = await openDirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearSavedHandle(): Promise<void> {
  try {
    const db = await openDirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const req = tx.objectStore(IDB_STORE).delete(IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

export interface UseOfflineDirectoryReturn {
  isConnected: boolean;
  dirName: string | null;
  isSupported: boolean;
  pickDirectory: () => Promise<boolean>;
  writeFile: (filename: string, content: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

export function useOfflineDirectory(): UseOfflineDirectoryReturn {
  const isSupported = "showDirectoryPicker" in window;
  const [isConnected, setIsConnected] = useState(false);
  const [dirName, setDirName] = useState<string | null>(null);
  // Cache the handle between renders without re-running effects
  const cachedHandle = useRef<FSDirectoryHandle | null>(null);

  // On mount: restore saved handle and check permission
  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;

    getSavedHandle().then(async (handle) => {
      if (!handle || cancelled) return;
      try {
        const perm = await handle.queryPermission({ mode: "readwrite" });
        if (perm === "granted") {
          cachedHandle.current = handle;
          if (!cancelled) {
            setIsConnected(true);
            setDirName(handle.name);
          }
        } else {
          // Needs user gesture to re-prompt — show name but disconnected
          if (!cancelled) {
            setIsConnected(false);
            setDirName(handle.name);
          }
        }
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  const pickDirectory = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      // File System Access API — cast through unknown for TS compat
      type ShowDirPicker = (opts?: {
        mode?: string;
      }) => Promise<FSDirectoryHandle>;
      const showDirPicker = (
        window as unknown as { showDirectoryPicker: ShowDirPicker }
      ).showDirectoryPicker;
      const handle = await showDirPicker({ mode: "readwrite" });
      await persistHandle(handle);
      cachedHandle.current = handle;
      setIsConnected(true);
      setDirName(handle.name);
      return true;
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name !== "AbortError") {
        console.warn("[useOfflineDirectory] pickDirectory error:", err);
      }
      return false;
    }
  }, [isSupported]);

  const writeFile = useCallback(
    async (filename: string, content: string): Promise<boolean> => {
      if (!isSupported) return false;
      try {
        let handle = cachedHandle.current;
        if (!handle) {
          handle = await getSavedHandle();
          if (!handle) return false;
          cachedHandle.current = handle;
        }
        const perm = await handle.requestPermission({ mode: "readwrite" });
        if (perm !== "granted") return false;
        const fileHandle = await handle.getFileHandle(filename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        setIsConnected(true);
        setDirName(handle.name);
        return true;
      } catch (err) {
        console.warn("[useOfflineDirectory] writeFile error:", err);
        return false;
      }
    },
    [isSupported],
  );

  const disconnect = useCallback(async () => {
    await clearSavedHandle();
    cachedHandle.current = null;
    setIsConnected(false);
    setDirName(null);
  }, []);

  return {
    isConnected,
    dirName,
    isSupported,
    pickDirectory,
    writeFile,
    disconnect,
  };
}
