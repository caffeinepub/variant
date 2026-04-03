import {
  BarChart3,
  Bell,
  BellOff,
  CheckCircle,
  Download,
  FileJson,
  FolderOpen,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import type { useNotifications } from "../hooks/useNotifications";
import type { useStorage } from "../hooks/useStorage";

interface SettingsProps {
  storage: ReturnType<typeof useStorage>;
  notifications: ReturnType<typeof useNotifications>;
}

export const Settings: React.FC<SettingsProps> = ({
  storage,
  notifications,
}) => {
  const { actor } = useActor();
  const [stats, setStats] = useState<{
    totalQuestions: bigint;
    totalVariants: bigint;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [linkingFolder, setLinkingFolder] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getStats()
      .then((s) => {
        setStats(s);
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  }, [actor]);

  const handleLinkFolder = async () => {
    setLinkingFolder(true);
    try {
      const ok = await storage.linkFolder();
      if (ok) {
        toast.success(
          "Folder linked! Data will auto-sync to variant-data.json",
        );
      } else {
        toast.error("Could not link folder. Try Chrome or Edge.");
      }
    } finally {
      setLinkingFolder(false);
    }
  };

  const handleExport = async () => {
    if (!actor) return;
    setExporting(true);
    try {
      const jsonText = await actor.exportData();
      let parsed: any[] = [];
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        parsed = [];
      }
      await storage.exportBackup(Array.isArray(parsed) ? parsed : []);
      toast.success("Backup exported!");
    } catch (e) {
      toast.error("Export failed");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!actor) return;
    setImporting(true);
    try {
      const backup = await storage.importBackup();
      if (!backup) {
        setImporting(false);
        return;
      }
      const jsonText = JSON.stringify(
        Array.isArray(backup) ? backup : (backup.questions ?? []),
      );
      await actor.importData(jsonText);
      const newStats = await actor.getStats();
      setStats(newStats);
      toast.success("Data imported successfully!");
    } catch (e) {
      toast.error("Import failed — invalid file format?");
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const syncDotColor = () => {
    switch (storage.syncStatus) {
      case "synced":
        return {
          color: "#22c55e",
          label: "Synced to folder",
          bg: "rgba(34,197,94,0.1)",
        };
      case "browser-only":
        return {
          color: "#f59e0b",
          label: "Browser memory only",
          bg: "rgba(245,158,11,0.1)",
        };
      case "error":
        return {
          color: "#ef4444",
          label: "Error — permission required",
          bg: "rgba(239,68,68,0.1)",
        };
      default:
        return {
          color: "rgba(154,167,178,0.5)",
          label: "Not configured",
          bg: "rgba(154,167,178,0.05)",
        };
    }
  };

  const dot = syncDotColor();

  // Notification permission display helpers
  const permissionInfo = () => {
    switch (notifications.permission) {
      case "granted":
        return {
          color: notifications.verified ? "#22c55e" : "#f59e0b",
          label: notifications.verified
            ? "Active & Verified"
            : "Enabled — not yet tested",
          bg: notifications.verified
            ? "rgba(34,197,94,0.1)"
            : "rgba(245,158,11,0.1)",
        };
      case "denied":
        return {
          color: "#ef4444",
          label: "Blocked by system",
          bg: "rgba(239,68,68,0.1)",
        };
      default:
        return {
          color: "rgba(154,167,178,0.5)",
          label: "Not requested",
          bg: "rgba(154,167,178,0.05)",
        };
    }
  };

  const notifInfo = permissionInfo();

  const testButtonLabel = () => {
    if (notifications.testCountdown !== null) {
      return `Testing... ${notifications.testCountdown}s`;
    }
    return "Send Test (5s)";
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="section-title">Settings</p>
        <h2 className="text-2xl font-bold text-white mt-1">
          Data &amp; <span className="neon-text">Export</span>
        </h2>
      </div>

      {/* === Timer Notifications === */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: "var(--cyan)" }} />
          <p className="section-title">Timer Notifications</p>
        </div>

        {/* Permission status row */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: notifInfo.bg,
            border: `1px solid ${notifInfo.color}30`,
          }}
          data-ocid="notifications.status.card"
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: notifInfo.color,
              boxShadow: `0 0 8px ${notifInfo.color}`,
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Notification Permission
            </p>
            <p className="text-xs" style={{ color: notifInfo.color }}>
              {notifInfo.label}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            data-ocid="notifications.enable.button"
            className="cyan-btn flex items-center gap-2"
            style={{ minHeight: "48px" }}
            onClick={() => notifications.requestPermission()}
          >
            <Bell size={14} />
            Enable Timer Notifications
          </button>

          <button
            type="button"
            data-ocid="notifications.test.button"
            className="outline-btn flex items-center gap-2"
            style={{ minHeight: "48px" }}
            onClick={() => notifications.testNotification()}
            disabled={notifications.testCountdown !== null}
          >
            {notifications.testCountdown !== null ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Bell size={14} />
            )}
            {testButtonLabel()}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          A test notification will appear in 5 seconds to verify your setup
          works.
        </p>

        {/* Denied modal — inline */}
        {notifications.showDeniedModal && (
          <div
            data-ocid="notifications.denied.modal"
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <div className="flex items-center gap-2">
              <BellOff size={16} style={{ color: "#ef4444" }} />
              <p className="text-sm font-bold" style={{ color: "#ef4444" }}>
                Notifications Blocked
              </p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              To see the timer while the app is closed, you must manually enable
              notifications in your{" "}
              <strong style={{ color: "#fca5a5" }}>
                Phone Settings &gt; Apps &gt; Naksha &gt; Notifications
              </strong>
              .
            </p>
            <button
              type="button"
              data-ocid="notifications.denied_modal.close_button"
              className="outline-btn"
              style={{ borderColor: "rgba(239,68,68,0.5)", color: "#ef4444" }}
              onClick={() => notifications.setShowDeniedModal(false)}
            >
              Got it
            </button>
          </div>
        )}
      </div>

      {/* === Persistent Storage === */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} style={{ color: "var(--cyan)" }} />
          <p className="section-title">Persistent Storage</p>
        </div>

        {/* Sync status row */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: dot.bg, border: `1px solid ${dot.color}30` }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: dot.color,
              boxShadow: `0 0 8px ${dot.color}`,
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Sync Status</p>
            <p className="text-xs" style={{ color: dot.color }}>
              {dot.label}
            </p>
          </div>
          {storage.isLinked && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "#22c55e" }}
            >
              <CheckCircle size={13} /> Linked
            </span>
          )}
        </div>

        {/* Linked folder status */}
        {storage.isLinked && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            <CheckCircle size={15} style={{ color: "#22c55e" }} />
            <span className="text-sm" style={{ color: "#22c55e" }}>
              Linked: <strong>variant-data.json</strong>
            </span>
          </div>
        )}

        <p className="text-sm text-slate-400">
          Link a local folder on your device. The app will auto-save a{" "}
          <code
            style={{
              background: "rgba(32,230,230,0.1)",
              padding: "1px 5px",
              borderRadius: "4px",
              color: "var(--cyan)",
              fontSize: "12px",
            }}
          >
            variant-data.json
          </code>{" "}
          file there every 2 seconds after changes.
        </p>

        <button
          type="button"
          data-ocid="settings.link_folder.button"
          className="cyan-btn flex items-center gap-2"
          style={{ minHeight: "48px" }}
          onClick={handleLinkFolder}
          disabled={linkingFolder}
        >
          {linkingFolder ? (
            <Loader2 size={14} className="animate-spin" />
          ) : storage.isLinked ? (
            <RefreshCw size={14} />
          ) : (
            <FolderOpen size={14} />
          )}
          {storage.isLinked ? "Re-link Folder" : "Link to Local Folder"}
        </button>

        <p className="text-xs text-slate-600">
          Requires Chrome or Edge (File System Access API). Data is also
          auto-saved to browser IndexedDB regardless.
        </p>
      </div>

      {/* Stats */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} style={{ color: "var(--cyan)" }} />
          <p className="section-title">Statistics</p>
        </div>
        {loadingStats ? (
          <Loader2
            size={20}
            className="animate-spin"
            style={{ color: "var(--cyan)" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: "rgba(32,230,230,0.06)",
                border: "1px solid rgba(32,230,230,0.15)",
              }}
            >
              <p className="text-3xl font-bold neon-text">
                {stats ? Number(stats.totalQuestions) : 0}
              </p>
              <p className="text-sm text-slate-400 mt-1">Master Questions</p>
            </div>
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: "rgba(132,100,255,0.06)",
                border: "1px solid rgba(132,100,255,0.15)",
              }}
            >
              <p
                className="text-3xl font-bold"
                style={{
                  color: "#a78bfa",
                  textShadow: "0 0 10px rgba(167,139,250,0.5)",
                }}
              >
                {stats ? Number(stats.totalVariants) : 0}
              </p>
              <p className="text-sm text-slate-400 mt-1">Generated Variants</p>
            </div>
          </div>
        )}
      </div>

      {/* File Management */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileJson size={16} style={{ color: "var(--cyan)" }} />
          <p className="section-title">File Management</p>
        </div>
        <p className="text-sm text-slate-400">
          Manually export or import all your master questions and variants as a
          .json backup file.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            data-ocid="settings.export.button"
            className="cyan-btn flex items-center gap-2"
            style={{ minHeight: "48px" }}
            onClick={handleExport}
            disabled={exporting || !actor}
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exporting ? "Exporting..." : "Export Backup"}
          </button>
          <button
            type="button"
            data-ocid="settings.import.button"
            className="outline-btn flex items-center gap-2"
            style={{ minHeight: "48px" }}
            onClick={handleImport}
            disabled={importing || !actor}
          >
            {importing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {importing ? "Importing..." : "Import Backup"}
          </button>
        </div>
        <p className="text-xs text-slate-600">
          Backup includes timestamp. Anti-corruption: empty data is never
          written.
        </p>
      </div>

      {/* Design System */}
      <div className="glass-card p-5 space-y-3">
        <p className="section-title">Design System</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Background", color: "#070B10" },
            { label: "Neon Cyan", color: "#20E6E6" },
            { label: "Cyan Bright", color: "#2CF6FF" },
            { label: "Card Glass", color: "rgba(16,24,32,0.55)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded"
                style={{
                  background: item.color,
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
