/**
 * useCapacitorStorage.ts
 * Replaces showDirectoryPicker with Capacitor Filesystem on native,
 * and Blob anchor-download on web/Android.
 * Uses dynamic runtime imports to avoid bundler resolution errors.
 */

function isNative(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

const dynamicImport = new Function("m", "return import(m)") as (
  m: string,
) => Promise<any>;

export function useCapacitorStorage() {
  const saveFileNative = async (
    filename: string,
    data: string,
  ): Promise<boolean> => {
    if (isNative()) {
      try {
        const { Filesystem, Directory, Encoding } = await dynamicImport(
          "@capacitor/filesystem",
        );
        await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return true;
      } catch (e) {
        console.warn("[useCapacitorStorage] Filesystem.writeFile failed:", e);
      }
    }

    try {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("[useCapacitorStorage] Blob download failed:", e);
    }
    return true;
  };

  const loadFileNative = async (filename: string): Promise<string | null> => {
    if (isNative()) {
      try {
        const { Filesystem, Directory, Encoding } = await dynamicImport(
          "@capacitor/filesystem",
        );
        const result = await Filesystem.readFile({
          path: filename,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return result.data as string;
      } catch (e) {
        console.warn("[useCapacitorStorage] Filesystem.readFile failed:", e);
        return null;
      }
    }
    return null;
  };

  return { saveFileNative, loadFileNative };
}
