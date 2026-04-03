import { useCallback, useEffect, useRef, useState } from "react";
import { useCapacitorNotifications } from "./useCapacitorNotifications";

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
  const capNotif = useCapacitorNotifications();

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
    const result = await capNotif.requestPermission();
    setPermission(result as NotificationPermission);

    if (result === "granted") {
      setShowDeniedModal(false);
    } else {
      setShowDeniedModal(true);
    }
  }, [capNotif]);

  const fireNotification = useCallback(
    (title: string, body: string) => {
      capNotif.scheduleNotification(title, body).catch((e) => {
        console.warn("[useNotifications] fireNotification failed:", e);
      });
    },
    [capNotif],
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

        // Fire via Capacitor bridge (or SW fallback on web)
        capNotif
          .scheduleNotification(
            "✅ Timer Test",
            "Notifications are working! Your timer alerts will appear here.",
          )
          .then(() => setVerified(true))
          .catch((e) => {
            console.warn("[useNotifications] testNotification fire failed:", e);
          });
      } else {
        setTestCountdown(count);
      }
    }, 1000);
  }, [testCountdown, permission, requestPermission, capNotif]);

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
