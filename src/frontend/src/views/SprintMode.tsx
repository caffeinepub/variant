import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  Eye,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MasterQuestion, Variant } from "../backend";
import { useActor } from "../hooks/useActor";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface QuizItem {
  variant: Variant;
  question: MasterQuestion;
}

type AnswerState = { chosen: number; correct: boolean } | null;

const QuizCard: React.FC<{ item: QuizItem; index: number }> = ({
  item,
  index,
}) => {
  const { variant, question } = item;
  const [answer, setAnswer] = useState<AnswerState>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleAnswer = (i: number) => {
    if (answer !== null) return;
    const correct = i === Number(variant.correctIndex);
    setAnswer({ chosen: i, correct });
    // Do NOT auto-show solution — user must tap 'View Solution'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(variant.questionText);
    toast.success("Copied!");
  };

  const getOptionStyle = (i: number): React.CSSProperties => {
    // Anti-spoiler: before ANY answer, all options look identical
    if (answer === null) {
      return {
        background: "rgba(16,24,32,0.6)",
        border: "1.5px solid rgba(32,230,230,0.2)",
        cursor: "pointer",
        transition: "all 0.2s",
      };
    }
    // After answer: reveal correct (green) and wrong (red)
    if (i === Number(variant.correctIndex)) {
      return {
        background: "rgba(34,197,94,0.12)",
        border: "1.5px solid rgba(34,197,94,0.6)",
        animation: "green-glow-pulse 1.5s ease-in-out infinite",
      };
    }
    if (i === answer.chosen && !answer.correct) {
      return {
        background: "rgba(239,68,68,0.12)",
        border: "1.5px solid rgba(239,68,68,0.6)",
        animation: "red-glow-pulse 1.5s ease-in-out infinite",
      };
    }
    return {
      background: "rgba(16,24,32,0.4)",
      border: "1.5px solid rgba(32,230,230,0.08)",
      opacity: 0.5,
    };
  };

  const getOptionCircleStyle = (i: number): React.CSSProperties => {
    if (answer === null) {
      return {
        background: "rgba(32,230,230,0.1)",
        color: "var(--cyan)",
        border: "1px solid rgba(32,230,230,0.3)",
      };
    }
    if (i === Number(variant.correctIndex)) {
      return {
        background: "rgba(34,197,94,0.25)",
        color: "#22c55e",
        border: "1px solid #22c55e",
      };
    }
    if (i === answer.chosen && !answer.correct) {
      return {
        background: "rgba(239,68,68,0.25)",
        color: "#ef4444",
        border: "1px solid #ef4444",
      };
    }
    return {
      background: "rgba(32,230,230,0.05)",
      color: "rgba(154,167,178,0.4)",
      border: "1px solid rgba(32,230,230,0.1)",
    };
  };

  return (
    <div
      data-ocid={`sprint.item.${index + 1}`}
      className="glass-card p-5 space-y-4 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="section-title">Question {index + 1}</span>
            {answer &&
              (answer.correct ? (
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#22c55e" }}
                >
                  <CheckCircle2 size={13} /> Correct
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#ef4444" }}
                >
                  <XCircle size={13} /> Wrong
                </span>
              ))}
          </div>
          <p className="math-text text-white text-sm leading-relaxed">
            {variant.questionText}
          </p>
        </div>
        <button
          type="button"
          data-ocid={`sprint.copy.button.${index + 1}`}
          className="outline-btn flex items-center gap-1 py-1 px-3 text-xs flex-shrink-0"
          onClick={handleCopy}
        >
          <Copy size={11} /> Copy
        </button>
      </div>

      <div className="space-y-2">
        {variant.mcqOptions.map((opt, i) => (
          <button
            type="button"
            // biome-ignore lint/suspicious/noArrayIndexKey: MCQ options ordered A-D
            key={i}
            data-ocid={`sprint.option-${OPTION_LABELS[i]}.button.${index + 1}`}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left touch-target"
            style={getOptionStyle(i)}
            onClick={() => handleAnswer(i)}
            disabled={answer !== null}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={getOptionCircleStyle(i)}
            >
              {OPTION_LABELS[i]}
            </span>
            <span className="math-text text-sm text-slate-200">{opt}</span>
          </button>
        ))}
      </div>

      {/* View Solution button — appears after ANY answer (correct or wrong) */}
      {answer !== null && question.solutionSteps.length > 0 && (
        <div className="animate-fade-in">
          <button
            type="button"
            data-ocid={`sprint.view_solution.button.${index + 1}`}
            className="outline-btn flex items-center gap-2 w-full justify-center"
            style={{
              minHeight: "48px",
              color: "#f59e0b",
              borderColor: "rgba(245,158,11,0.4)",
            }}
            onClick={() => setShowSolution((v) => !v)}
          >
            <Eye size={14} />
            {showSolution ? (
              <>
                <ChevronUp size={13} /> Hide Solution
              </>
            ) : (
              <>
                <ChevronDown size={13} /> View Solution (
                {question.solutionSteps.length} steps)
              </>
            )}
          </button>
          {showSolution && (
            <div className="space-y-1 mt-2 animate-fade-in">
              {question.solutionSteps.map((step, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                  key={i}
                  className="flex gap-2 p-2 rounded-lg"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: "rgba(245,158,11,0.2)",
                      color: "#f59e0b",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.replace(/^Step \d+:\s*/i, "")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {answer !== null && (
        <p
          className="text-sm font-semibold animate-fade-in"
          style={{ color: answer.correct ? "#22c55e" : "#ef4444" }}
        >
          {answer.correct
            ? `✓ Correct! Answer: ${variant.answer}`
            : `✗ Wrong. Correct answer: ${variant.answer}`}
        </p>
      )}
    </div>
  );
};

export const SprintMode: React.FC = () => {
  const { actor } = useActor();
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const loadItems = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const questions = await actor.listAllMasterQuestions();
      const allItems: QuizItem[] = [];
      await Promise.all(
        questions.map(async (q) => {
          const variants = await actor.listVariantsByMasterId(q.id);
          for (const v of variants) {
            allItems.push({ variant: v, question: q });
          }
        }),
      );
      allItems.sort((a, b) => Number(b.variant.id - a.variant.id));
      setItems(allItems);
    } catch (e) {
      toast.error("Failed to load sprint items");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-title">Sprint Mode</p>
          <h2 className="text-2xl font-bold text-white mt-1">
            Quiz <span className="neon-text">Sprint</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {items.length} variant{items.length !== 1 ? "s" : ""} ready
          </p>
        </div>
        <button
          type="button"
          data-ocid="sprint.reset.button"
          className="outline-btn flex items-center gap-2"
          style={{ minHeight: "48px" }}
          onClick={() => setResetKey((k) => k + 1)}
        >
          <RotateCcw size={14} />
          Reset All
        </button>
      </div>

      {loading ? (
        <div
          data-ocid="sprint.loading_state"
          className="flex items-center justify-center py-20"
        >
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "var(--cyan)" }}
          />
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid="sprint.empty_state"
          className="flex flex-col items-center justify-center py-20 space-y-3"
        >
          <Dumbbell size={48} style={{ color: "rgba(32,230,230,0.3)" }} />
          <p className="text-slate-500 text-lg">No variants yet</p>
          <p className="text-slate-600 text-sm">
            Generate variants from My Questions to start sprinting
          </p>
        </div>
      ) : (
        <div className="space-y-5" key={resetKey}>
          {items.map((item, i) => (
            <QuizCard
              key={`${item.variant.id}-${resetKey}`}
              item={item}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SprintMode;
