import { Bell, BellOff } from "lucide-react";
import type React from "react";

interface NotificationBellProps {
  permission: "default" | "granted" | "denied";
  verified: boolean;
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  permission,
  verified,
  onClick,
}) => {
  let icon: React.ReactNode;
  let tooltipText: string;
  let iconColor: string;
  let buttonStyle: React.CSSProperties;

  if (permission === "denied") {
    // Red bell with slash — blocked
    icon = <BellOff size={16} />;
    iconColor = "#ef4444";
    tooltipText = "Notifications blocked";
    buttonStyle = {
      color: "#ef4444",
    };
  } else if (permission === "granted" && verified) {
    // Glowing green bell — active and verified
    icon = <Bell size={16} />;
    iconColor = "#22c55e";
    tooltipText = "Notifications active";
    buttonStyle = {
      color: "#22c55e",
      animation: "green-glow-pulse 2s ease-in-out infinite",
      borderRadius: "50%",
    };
  } else if (permission === "granted" && !verified) {
    // Amber bell — enabled but not tested
    icon = <Bell size={16} />;
    iconColor = "#f59e0b";
    tooltipText = "Notifications enabled, not tested";
    buttonStyle = {
      color: "#f59e0b",
      boxShadow: "0 0 6px rgba(245,158,11,0.4)",
    };
  } else {
    // Grey bell — not requested
    icon = <Bell size={16} />;
    iconColor = "rgba(154,167,178,0.5)";
    tooltipText = "Notifications not set up";
    buttonStyle = {
      color: "rgba(154,167,178,0.5)",
    };
  }

  return (
    <div title={tooltipText} style={{ display: "inline-flex" }}>
      <button
        type="button"
        data-ocid="notifications.bell.button"
        onClick={onClick}
        aria-label={tooltipText}
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderRadius: "8px",
          cursor: onClick ? "pointer" : "default",
          padding: 0,
          transition: "color 0.2s, box-shadow 0.2s",
          ...buttonStyle,
          color: iconColor,
        }}
      >
        {icon}
      </button>
    </div>
  );
};

export default NotificationBell;
