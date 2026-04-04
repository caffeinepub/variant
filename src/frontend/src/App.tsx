import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  Dumbbell,
  Settings as SettingsIcon,
  Sparkles,
  Trophy,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { LoginButton } from "./components/LoginButton";
import { NotificationBell } from "./components/NotificationBell";
import { SyncStatusIcon } from "./components/SyncStatusIcon";
import { prefGet } from "./hooks/useCapacitorPreferences";
import { useNotifications } from "./hooks/useNotifications";
import { useStorage } from "./hooks/useStorage";
import { MyQuestions } from "./views/MyQuestions";
import { PermissionManager } from "./views/PermissionManager";
import { Perms } from "./views/Perms";
import { Settings } from "./views/Settings";
import { SmartPaste } from "./views/SmartPaste";
import { SprintMode } from "./views/SprintMode";

type View = "paste" | "questions" | "sprint" | "settings" | "perms";

const NAV_ITEMS: {
  id: View;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: "paste",
    label: "Smart Paste",
    icon: <Sparkles size={18} />,
    desc: "Paste & classify",
  },
  {
    id: "questions",
    label: "My Questions",
    icon: <BookOpen size={18} />,
    desc: "Question bank",
  },
  {
    id: "sprint",
    label: "Sprint Mode",
    icon: <Dumbbell size={18} />,
    desc: "Quiz variants",
  },
  {
    id: "perms",
    label: "Perms",
    icon: <Trophy size={18} />,
    desc: "Sprint records",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <SettingsIcon size={18} />,
    desc: "Export & data",
  },
];

export default function App() {
  const [view, setView] = useState<View>("paste");
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storage = useStorage();
  const notifications = useNotifications();

  useEffect(() => {
    prefGet("permissionsChecked").then((val) => {
      if (val !== "true") {
        setShowPermissionManager(true);
      }
    });
  }, []);

  const handleSetView = (newView: View) => {
    setView(newView);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const handleSaved = () => {
    handleSetView("questions");
  };

  const handleSavedAndSprint = () => {
    handleSetView("sprint");
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--obsidian)" }}
    >
      <Toaster position="top-right" theme="dark" />

      {showPermissionManager && (
        <PermissionManager onDismiss={() => setShowPermissionManager(false)} />
      )}

      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex"
        style={{
          width: "240px",
          minWidth: "240px",
          background: "rgba(8,12,18,0.95)",
          borderRight: "1px solid rgba(32,230,230,0.1)",
          backdropFilter: "blur(12px)",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "24px 20px",
            borderBottom: "1px solid rgba(32,230,230,0.08)",
          }}
        >
          <img
            src="/assets/generated/variant-logo-transparent.dim_200x200.png"
            alt="Variant"
            style={{
              width: "36px",
              height: "36px",
              objectFit: "contain",
              filter: "drop-shadow(0 0 8px rgba(32,230,230,0.5))",
            }}
          />
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                background:
                  "linear-gradient(135deg, #2CF6FF, #20E6E6, #14CFCB)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 8px rgba(32,230,230,0.4))",
              }}
            >
              Variant
            </h1>
            <p
              style={{
                fontSize: "10px",
                color: "rgba(32,230,230,0.5)",
                marginTop: "1px",
              }}
            >
              Math Drill Engine
            </p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "rgba(154,167,178,0.4)",
              padding: "0 12px",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            Navigation
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "12px",
                border:
                  view === item.id
                    ? "1px solid rgba(32,230,230,0.25)"
                    : "1px solid transparent",
                background:
                  view === item.id ? "rgba(32,230,230,0.1)" : "transparent",
                color:
                  view === item.id ? "var(--cyan)" : "rgba(154,167,178,0.8)",
                cursor: "pointer",
                textAlign: "left",
                marginBottom: "4px",
                transition: "all 0.2s",
              }}
              onClick={() => handleSetView(item.id)}
            >
              <span
                style={{
                  opacity: view === item.id ? 1 : 0.7,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {item.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: view === item.id ? 700 : 500,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "rgba(154,167,178,0.5)",
                    marginTop: "2px",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(32,230,230,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SyncStatusIcon
              status={storage.syncStatus}
              isLinked={storage.isLinked}
            />
            <NotificationBell
              permission={notifications.permission}
              verified={notifications.verified}
              onClick={() => handleSetView("settings")}
            />
          </div>
          <LoginButton compact={false} />
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Mobile header */}
        <header
          className="md:hidden"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(32,230,230,0.08)",
            background: "rgba(8,12,18,0.95)",
            backdropFilter: "blur(12px)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src="/assets/generated/variant-logo-transparent.dim_200x200.png"
              alt="Variant"
              style={{
                width: "28px",
                height: "28px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 6px rgba(32,230,230,0.5))",
              }}
            />
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 900,
                background:
                  "linear-gradient(135deg, #2CF6FF, #20E6E6, #14CFCB)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Variant
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SyncStatusIcon
              status={storage.syncStatus}
              isLinked={storage.isLinked}
            />
            <NotificationBell
              permission={notifications.permission}
              verified={notifications.verified}
              onClick={() => handleSetView("settings")}
            />
            <LoginButton compact={true} />
          </div>
        </header>

        {/* Scrollable view area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 20px",
            paddingBottom: "80px", // space for mobile nav
          }}
        >
          {view === "paste" && (
            <SmartPaste
              onSaved={handleSaved}
              onSavedAndSprint={handleSavedAndSprint}
            />
          )}
          {view === "questions" && <MyQuestions />}
          {view === "sprint" && <SprintMode />}
          {view === "perms" && <Perms />}
          {view === "settings" && (
            <Settings
              storage={storage}
              notifications={notifications}
              onOpenPermissions={() => setShowPermissionManager(true)}
            />
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav md:hidden">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`mobile-nav.${item.id}.link`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: view === item.id ? "var(--cyan)" : "rgba(154,167,178,0.5)",
              transition: "color 0.2s",
              minWidth: "48px",
              minHeight: "48px",
              justifyContent: "center",
            }}
            onClick={() => handleSetView(item.id)}
          >
            <span
              style={{
                filter:
                  view === item.id
                    ? "drop-shadow(0 0 6px rgba(32,230,230,0.7))"
                    : "none",
                transition: "filter 0.2s",
              }}
            >
              {item.icon}
            </span>
            <span style={{ fontSize: "9px", fontWeight: 700 }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
