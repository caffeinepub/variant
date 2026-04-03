/**
 * useCapacitorPreferences.ts
 * Thin wrapper around Capacitor Preferences API with localStorage fallback for web.
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

export async function prefGet(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      const { Preferences } = await dynamicImport("@capacitor/preferences");
      const { value } = await Preferences.get({ key });
      return value;
    } catch {
      // fallthrough
    }
  }
  return localStorage.getItem(key);
}

export async function prefSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await dynamicImport("@capacitor/preferences");
      await Preferences.set({ key, value });
      return;
    } catch {
      // fallthrough
    }
  }
  localStorage.setItem(key, value);
}

export async function prefRemove(key: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await dynamicImport("@capacitor/preferences");
      await Preferences.remove({ key });
      return;
    } catch {
      // fallthrough
    }
  }
  localStorage.removeItem(key);
}
