import { useCallback, useEffect, useRef, useState } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface UseNotificationsReturn {
  permission: NotificationPermission;
  verified: boolean;
  testCountdown: number | null;
  showDeniedModal: boolean;
  setShowDeniedModal: (v: boolean) => void;
  swRegistration: ServiceWorkerRegistration | null;
  requestPermission: () => Promise<void>;
  testNotification: () => Promise<void>;
  fireNotification: (title: string, body: string) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission as NotificationPermission;
    }
    return "default";
  });
  const [verified, setVerified] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [showDeniedModal, setShowDeniedModal] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwRegistration(reg);
        })
        .catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setShowDeniedModal(true);
      return;
    }

    const result = await Notification.requestPermission();
    const perm = result as NotificationPermission;
    setPermission(perm);

    if (perm === "granted") {
      setShowDeniedModal(false);
    } else {
      // denied or default (dismissed)
      setShowDeniedModal(true);
    }
  }, []);

  const fireNotification = useCallback(
    (title: string, body: string) => {
      if (swRegistration?.active) {
        swRegistration.active.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body,
        });
      } else if ("Notification" in window && permission === "granted") {
        // Fallback: direct Notification API
        new Notification(title, {
          body,
          tag: "timer-done",
          icon: "/assets/generated/variant-logo-transparent.dim_200x200.png",
        });
      }
    },
    [swRegistration, permission],
  );

  const testNotification = useCallback(async () => {
    if (testCountdown !== null) return; // already running

    if (permission !== "granted") {
      await requestPermission();
      return;
    }

    setTestCountdown(5);
    let count = 5;

    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setTestCountdown(null);

        // Send the test notification
        if (swRegistration?.active) {
          swRegistration.active.postMessage({
            type: "SHOW_NOTIFICATION",
            title: "✅ Timer Test",
            body: "Notifications are working! Your timer alerts will appear here.",
          });
          setVerified(true);
        } else if ("Notification" in window && permission === "granted") {
          new Notification("✅ Timer Test", {
            body: "Notifications are working! Your timer alerts will appear here.",
            tag: "timer-done",
            icon: "/assets/generated/variant-logo-transparent.dim_200x200.png",
          });
          setVerified(true);
        }
      } else {
        setTestCountdown(count);
      }
    }, 1000);
  }, [testCountdown, permission, swRegistration, requestPermission]);

  return {
    permission,
    verified,
    testCountdown,
    showDeniedModal,
    setShowDeniedModal,
    swRegistration,
    requestPermission,
    testNotification,
    fireNotification,
  };
}
