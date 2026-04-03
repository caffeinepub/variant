/**
 * useCapacitorNotifications.ts
 * Wraps @capacitor/local-notifications with web Notification API fallback.
 * Uses dynamic runtime imports to avoid bundler resolution errors.
 */

function isNative(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

// Build-time safe dynamic import helper — bypasses Rollup resolution
const dynamicImport = new Function("m", "return import(m)") as (
  m: string,
) => Promise<any>;

export type NotifPermissionResult = "granted" | "denied" | "default";

export async function checkNotificationPermission(): Promise<NotifPermissionResult> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await dynamicImport(
        "@capacitor/local-notifications",
      );
      const result = await LocalNotifications.checkPermissions();
      if (result.display === "granted") return "granted";
      if (result.display === "denied") return "denied";
      return "default";
    } catch {
      // fallthrough to web
    }
  }
  if (!("Notification" in window)) return "denied";
  return Notification.permission as NotifPermissionResult;
}

export async function requestNotificationPermission(): Promise<NotifPermissionResult> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await dynamicImport(
        "@capacitor/local-notifications",
      );
      const result = await LocalNotifications.requestPermissions();
      if (result.display === "granted") return "granted";
      if (result.display === "denied") return "denied";
      return "default";
    } catch {
      // fallthrough to web
    }
  }
  if (!("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result as NotifPermissionResult;
}

export async function scheduleNotification(
  title: string,
  body: string,
): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await dynamicImport(
        "@capacitor/local-notifications",
      );
      await LocalNotifications.schedule({
        notifications: [
          { title, body, id: 1, schedule: { at: new Date(Date.now() + 100) } },
        ],
      });
      return;
    } catch {
      // fallthrough to web
    }
  }

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: "SHOW_NOTIFICATION", title, body });
      return;
    }
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      tag: "timer-done",
      icon: "/assets/generated/variant-logo-transparent.dim_200x200.png",
    });
  }
}

export function useCapacitorNotifications() {
  return {
    requestPermission: requestNotificationPermission,
    checkPermission: checkNotificationPermission,
    scheduleNotification,
  };
}
