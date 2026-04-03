import { Toaster } from "@/components/ui/sonner";
import {
  BookOpen,
  Dumbbell,
  Settings as SettingsIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { NotificationBell } from "./components/NotificationBell";
import { SyncStatusIcon } from "./components/SyncStatusIcon";
import { useNotifications } from "./hooks/useNotifications";
import { useStorage } from "./hooks/useStorage";
import { MyQuestions } from "./views/MyQuestions";
import { Settings } from "./views/Settings";
import { SmartPaste } from "./views/SmartPaste";
import { SprintMode } from "./views/SprintMode";

type View = "paste" | "questions" | "sprint" | "settings";

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
    id: "settings",
    label: "Settings",
    icon: <SettingsIcon size={18} />,
    desc: "Export & data",
  },
];

export default function App() {
  const [view, setView] = useState<View>("paste");
  const [questionsRefresh, setQuestionsRefresh] = useState(0);
  const storage = useStorage();
  const notifications = useNotifications();

  const handleSaved = () => {
    setQuestionsRefresh((k) => k + 1);
    setView("questions");
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--obsidian)" }}
    >
      <Toaster position="top-right" theme="dark" />

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
              onClick={() => setView(item.id)}
            >
              <span
                style={{
                  filter:
                    view === item.id
                      ? "drop-shadow(0 0 6px rgba(32,230,230,0.7))"
                      : "none",
                }}
              >
                {item.icon}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "rgba(154,167,178,0.5)",
                    marginTop: "1px",
                  }}
                >
                  {item.desc}
                </p>
              </div>
              {view === item.id && (
                <div
                  style={{
                    width: "3px",
                    height: "20px",
                    borderRadius: "2px",
                    background: "var(--cyan)",
                    boxShadow: "0 0 8px rgba(32,230,230,0.8)",
                  }}
                />
              )}
            </button>
          ))}
        </nav>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(32,230,230,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "10px",
              background: "rgba(32,230,230,0.06)",
              border: "1px solid rgba(32,230,230,0.12)",
            }}
          >
            <Zap size={13} style={{ color: "var(--cyan)" }} />
            <span style={{ fontSize: "11px", color: "var(--cyan)" }}>
              Powered by ICP
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: "60px",
            minHeight: "60px",
            background: "rgba(7,11,16,0.8)",
            borderBottom: "1px solid rgba(32,230,230,0.08)",
            backdropFilter: "blur(8px)",
            flexShrink: 0,
          }}
        >
          {/* Mobile: logo + title; Desktop: just title */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/variant-logo-transparent.dim_200x200.png"
              alt="Variant"
              className="block md:hidden"
              style={{
                width: "28px",
                height: "28px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 6px rgba(32,230,230,0.5))",
              }}
            />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
              {NAV_ITEMS.find((n) => n.id === view)?.label}
            </h2>
          </div>

          {/* Right: notification bell + sync icon */}
          <div className="flex items-center gap-2">
            <NotificationBell
              permission={notifications.permission}
              verified={notifications.verified}
              onClick={() => setView("settings")}
            />
            <SyncStatusIcon
              status={storage.syncStatus}
              isLinked={storage.isLinked}
            />
          </div>
        </header>

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 16px",
            paddingBottom: "88px", // extra space for mobile bottom nav
          }}
          className="md:!px-6 md:!pb-6"
        >
          {view === "paste" && <SmartPaste onSaved={handleSaved} />}
          {view === "questions" && <MyQuestions key={questionsRefresh} />}
          {view === "sprint" && <SprintMode />}
          {view === "settings" && (
            <Settings storage={storage} notifications={notifications} />
          )}
        </main>
      </div>

      {/* Mobile bottom nav — visible only on mobile */}
      <nav className="mobile-nav md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`mobile-nav.${item.id}.link`}
              className="touch-target"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: active ? "var(--cyan)" : "rgba(154,167,178,0.5)",
                filter: active
                  ? "drop-shadow(0 0 6px rgba(32,230,230,0.7))"
                  : "none",
                transition: "color 0.2s, filter 0.2s",
                padding: "8px 4px",
              }}
              onClick={() => setView(item.id)}
            >
              <span style={{ fontSize: "18px", lineHeight: 1 }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
