/**
 * useCapacitorNotifications.ts
 * Wraps @capacitor/local-notifications with web Notification API fallback.
 *
 * Module-level functions are stable references and can be used freely in effects.
 */

import { LocalNotifications } from "@capacitor/local-notifications";

function isNative(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

export type NotifPermissionResult = "granted" | "denied" | "default";

/** Check current notification permission status (stable, module-level). */
export async function checkNotificationPermission(): Promise<NotifPermissionResult> {
  if (isNative()) {
    const result = await LocalNotifications.checkPermissions();
    if (result.display === "granted") return "granted";
    if (result.display === "denied") return "denied";
    return "default";
  }
  if (!("Notification" in window)) return "denied";
  return Notification.permission as NotifPermissionResult;
}

/** Request notification permission (stable, module-level). */
export async function requestNotificationPermission(): Promise<NotifPermissionResult> {
  if (isNative()) {
    const result = await LocalNotifications.requestPermissions();
    if (result.display === "granted") return "granted";
    if (result.display === "denied") return "denied";
    return "default";
  }
  if (!("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result as NotifPermissionResult;
}

/** Schedule / fire a notification (stable, module-level). */
export async function scheduleNotification(
  title: string,
  body: string,
): Promise<void> {
  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: 1,
          schedule: { at: new Date(Date.now() + 100) },
        },
      ],
    });
    return;
  }

  // Web fallback: post to active SW
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body,
      });
      return;
    }
  }

  // Last-resort fallback
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      tag: "timer-done",
      icon: "/assets/generated/variant-logo-transparent.dim_200x200.png",
    });
  }
}

/**
 * Hook form — returns stable function references for use in components.
 * Internally delegates to module-level functions.
 */
export function useCapacitorNotifications() {
  return {
    requestPermission: requestNotificationPermission,
    checkPermission: checkNotificationPermission,
    scheduleNotification,
  };
}
