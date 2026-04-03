import { Trash2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface SprintReport {
  id: string;
  questionText: string;
  correct: number;
  total: number;
  date: string;
}

export const Perms: React.FC = () => {
  const [reports, setReports] = useState<SprintReport[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("variant-perms");
    if (raw) {
      try {
        setReports(JSON.parse(raw));
      } catch {
        setReports([]);
      }
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    localStorage.setItem("variant-perms", JSON.stringify(updated));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="section-title">Permanent Records</p>
        <h2 className="text-2xl font-bold text-white mt-1">
          Sprint <span className="neon-text">History</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {reports.length} session{reports.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {reports.length === 0 ? (
        <div
          data-ocid="perms.empty_state"
          className="flex flex-col items-center justify-center py-20 space-y-3"
        >
          <Trophy size={48} style={{ color: "rgba(32,230,230,0.3)" }} />
          <p className="text-slate-500 text-lg">No records yet</p>
          <p className="text-slate-600 text-sm">
            Complete a Sprint session to save your first record
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r, idx) => {
            const pct = r.total > 0 ? (r.correct / r.total) * 100 : 0;
            const color =
              pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
            return (
              <div
                key={r.id}
                data-ocid={`perms.item.${idx + 1}`}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className="math-text text-white text-sm leading-relaxed"
                    style={{ maxHeight: "60px", overflowY: "auto", flex: 1 }}
                  >
                    {r.questionText}
                  </p>
                  <button
                    type="button"
                    data-ocid={`perms.delete_button.${idx + 1}`}
                    onClick={() => handleDelete(r.id)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Delete record"
                  >
                    <Trash2
                      size={14}
                      className="text-red-400/60 hover:text-red-400"
                    />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: "999px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>
                    {r.correct}/{r.total}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{r.date}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Perms;
