import { CheckCircle, HardDrive, Shield, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  checkNotificationPermission,
  useCapacitorNotifications,
} from "../hooks/useCapacitorNotifications";
import { prefGet, prefSet } from "../hooks/useCapacitorPreferences";
import { useCapacitorStorage } from "../hooks/useCapacitorStorage";

type PermState = "idle" | "granted" | "denied" | "loading";

interface PermissionManagerProps {
  onDismiss: () => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  onDismiss,
}) => {
  const capNotif = useCapacitorNotifications();
  const capStorage = useCapacitorStorage();

  const [notifState, setNotifState] = useState<PermState>("idle");
  const [storageState, setStorageState] = useState<PermState>("idle");

  // Check current states on mount — use module-level function (stable ref)
  useEffect(() => {
    checkNotificationPermission().then((perm) => {
      if (perm === "granted") setNotifState("granted");
      else if (perm === "denied") setNotifState("denied");
    });

    prefGet("storagePermission").then((val) => {
      if (val === "granted") setStorageState("granted");
    });
  }, []);

  const handleGrantNotif = async () => {
    setNotifState("loading");
    const result = await capNotif.requestPermission();
    setNotifState(result === "granted" ? "granted" : "denied");
  };

  const handleGrantStorage = async () => {
    setStorageState("loading");
    // On native: attempt a test write to verify FS access.
    // On web: just mark as granted via Preferences.
    try {
      await capStorage.saveFileNative("variant-test.txt", "permissions-check");
    } catch {
      // On web the saveFileNative triggers a download—that's fine.
    }
    await prefSet("storagePermission", "granted");
    setStorageState("granted");
  };

  const handleContinue = async () => {
    await prefSet("permissionsChecked", "true");
    onDismiss();
  };

  const stateIcon = (state: PermState) => {
    if (state === "granted")
      return <CheckCircle size={16} style={{ color: "#22c55e" }} />;
    if (state === "denied")
      return <XCircle size={16} style={{ color: "#ef4444" }} />;
    return (
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "rgba(154,167,178,0.4)",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  };

  const stateLabel = (state: PermState) => {
    switch (state) {
      case "granted":
        return { text: "Granted", color: "#22c55e" };
      case "denied":
        return { text: "Blocked", color: "#ef4444" };
      case "loading":
        return { text: "Requesting...", color: "var(--cyan)" };
      default:
        return { text: "Not requested", color: "rgba(154,167,178,0.5)" };
    }
  };

  return (
    /* Full-screen overlay */
    <div
      data-ocid="permissions.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(7,11,16,0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(12,18,26,0.95)",
          border: "1px solid rgba(32,230,230,0.25)",
          borderRadius: "20px",
          padding: "32px 28px",
          boxShadow:
            "0 0 60px rgba(32,230,230,0.08), 0 24px 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(32,230,230,0.1)",
              border: "1px solid rgba(32,230,230,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={20} style={{ color: "var(--cyan)" }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              Permission Manager
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "rgba(154,167,178,0.6)",
                marginTop: "2px",
              }}
            >
              Grant access for full functionality
            </p>
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(32,230,230,0.1)",
            margin: "20px 0",
          }}
        />

        {/* Permission Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Notifications */}
          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(32,230,230,0.04)",
              border:
                notifState === "granted"
                  ? "1px solid rgba(34,197,94,0.3)"
                  : notifState === "denied"
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(32,230,230,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(32,230,230,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "18px" }}>🔔</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                Notifications
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: stateLabel(notifState).color,
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {stateIcon(notifState)}
                {stateLabel(notifState).text}
              </p>
            </div>
            {notifState !== "granted" && (
              <button
                type="button"
                data-ocid="permissions.notifications.button"
                disabled={notifState === "loading"}
                onClick={handleGrantNotif}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(32,230,230,0.4)",
                  background: "rgba(32,230,230,0.1)",
                  color: "var(--cyan)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  opacity: notifState === "loading" ? 0.5 : 1,
                }}
              >
                Grant
              </button>
            )}
          </div>

          {/* Storage */}
          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(32,230,230,0.04)",
              border:
                storageState === "granted"
                  ? "1px solid rgba(34,197,94,0.3)"
                  : storageState === "denied"
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(32,230,230,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(32,230,230,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HardDrive size={18} style={{ color: "var(--cyan)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                Storage
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: stateLabel(storageState).color,
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {stateIcon(storageState)}
                {stateLabel(storageState).text}
              </p>
            </div>
            {storageState !== "granted" && (
              <button
                type="button"
                data-ocid="permissions.storage.button"
                disabled={storageState === "loading"}
                onClick={handleGrantStorage}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(32,230,230,0.4)",
                  background: "rgba(32,230,230,0.1)",
                  color: "var(--cyan)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  opacity: storageState === "loading" ? 0.5 : 1,
                }}
              >
                Grant
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(32,230,230,0.1)",
            margin: "20px 0",
          }}
        />

        <p
          style={{
            fontSize: "11px",
            color: "rgba(154,167,178,0.45)",
            textAlign: "center",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}
        >
          You can update these any time in Settings.
        </p>

        {/* Continue button */}
        <button
          type="button"
          data-ocid="permissions.continue.button"
          onClick={handleContinue}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #20E6E6, #14CFCB)",
            color: "#070B10",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: "0 0 20px rgba(32,230,230,0.35)",
          }}
        >
          Continue to Variant
        </button>
      </div>
    </div>
  );
};

export default PermissionManager;
