import type React from "react";

interface SyncStatusIconProps {
  status: "idle" | "synced" | "browser-only" | "error";
  isLinked?: boolean;
}

export const SyncStatusIcon: React.FC<SyncStatusIconProps> = ({
  status,
  isLinked,
}) => {
  const getConfig = () => {
    switch (status) {
      case "synced":
        return {
          color: "#22c55e",
          glow: "rgba(34,197,94,0.8)",
          label: "Synced to folder",
          animation: "sync-green-pulse 2s ease-in-out infinite",
        };
      case "browser-only":
        return {
          color: "#f59e0b",
          glow: "rgba(245,158,11,0.8)",
          label: "Browser memory only",
          animation: "sync-yellow-pulse 2s ease-in-out infinite",
        };
      case "error":
        return {
          color: "#ef4444",
          glow: "rgba(239,68,68,0.8)",
          label: "Save failed",
          animation: "sync-red-pulse 1s ease-in-out infinite",
        };
      default:
        return {
          color: "rgba(154,167,178,0.4)",
          glow: "transparent",
          label: isLinked ? "Linked" : "Not linked",
          animation: "none",
        };
    }
  };

  const config = getConfig();

  return (
    <div
      data-ocid="sync.toggle"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "999px",
        background: "rgba(16,24,32,0.8)",
        border: `1px solid ${config.color}30`,
        cursor: "default",
        userSelect: "none",
      }}
      title={config.label}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: config.color,
          boxShadow: `0 0 8px ${config.glow}`,
          animation: config.animation,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontSize: "10px",
          color: config.color,
          fontWeight: 600,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
        }}
      >
        {status === "synced"
          ? "Synced"
          : status === "browser-only"
            ? "Browser"
            : status === "error"
              ? "Sync Error"
              : "Offline"}
      </span>
    </div>
  );
};

export default SyncStatusIcon;
