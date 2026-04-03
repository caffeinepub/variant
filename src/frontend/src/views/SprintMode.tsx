import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  Eye,
  Loader2,
  Play,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MasterQuestion } from "../backend";
import { useActor } from "../hooks/useActor";
import { generateVariantQuestion } from "../utils/variantGenerator";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface SprintModeProps {
  activeQuestion?: MasterQuestion | null;
  onClearActiveQuestion?: () => void;
}

type VariantCard =
  | { type: "original"; question: MasterQuestion }
  | {
      type: "variant";
      variant: ReturnType<typeof generateVariantQuestion>;
      index: number;
      question: MasterQuestion;
    }
  | { type: "report"; correct: number; total: number; questionText: string };

type AnswerState = { chosen: number; correct: boolean } | null;

// ── Single Quiz Card (original or variant) ──────────────────────────────────
interface QuizCardProps {
  cardIndex: number;
  questionText: string;
  mcqOptions: string[];
  correctIndex: number;
  answer: string;
  solutionSteps: string[];
  onAnswer: (correct: boolean) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({
  cardIndex,
  questionText,
  mcqOptions,
  correctIndex,
  answer,
  solutionSteps,
  onAnswer,
}) => {
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (i: number) => {
    if (answered) return;
    const correct = i === correctIndex;
    setAnswerState({ chosen: i, correct });
    setAnswered(true);
    onAnswer(correct);
  };

  const getOptionStyle = (i: number): React.CSSProperties => {
    if (answerState === null) {
      return {
        background: "rgba(16,24,32,0.6)",
        border: "1.5px solid rgba(32,230,230,0.2)",
        cursor: "pointer",
        transition: "all 0.2s",
      };
    }
    if (i === correctIndex) {
      return {
        background: "rgba(32,230,230,0.15)",
        border: "1.5px solid var(--cyan)",
        animation: "green-glow-pulse 1.5s ease-in-out infinite",
      };
    }
    if (i === answerState.chosen && !answerState.correct) {
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
    if (answerState === null) {
      return {
        background: "rgba(32,230,230,0.1)",
        color: "var(--cyan)",
        border: "1px solid rgba(32,230,230,0.3)",
      };
    }
    if (i === correctIndex) {
      return {
        background: "rgba(32,230,230,0.25)",
        color: "var(--cyan)",
        border: "1px solid var(--cyan)",
      };
    }
    if (i === answerState.chosen && !answerState.correct) {
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
      className="glass-card p-5 space-y-4"
      style={{
        minWidth: "300px",
        maxWidth: "340px",
        flexShrink: 0,
        scrollSnapAlign: "start",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="section-title">Card {cardIndex + 1}</span>
        {answerState &&
          (answerState.correct ? (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--cyan)" }}
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

      <p
        className="math-text text-white text-sm leading-relaxed"
        style={{ maxHeight: "120px", overflowY: "auto" }}
      >
        {questionText}
      </p>

      <div className="space-y-2">
        {mcqOptions.map((opt, i) => (
          <button
            type="button"
            // biome-ignore lint/suspicious/noArrayIndexKey: MCQ options ordered A-D
            key={i}
            data-ocid={`sprint.card${cardIndex + 1}.option-${OPTION_LABELS[i]}.button`}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left touch-target"
            style={getOptionStyle(i)}
            onClick={() => handleAnswer(i)}
            disabled={answered}
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

      {answerState !== null && (
        <p
          className="text-sm font-semibold animate-fade-in"
          style={{ color: answerState.correct ? "var(--cyan)" : "#ef4444" }}
        >
          {answerState.correct
            ? `✓ Correct! Answer: ${answer}`
            : `✗ Wrong. Correct: ${answer}`}
        </p>
      )}

      {answerState !== null && solutionSteps.length > 0 && (
        <div className="animate-fade-in">
          <button
            type="button"
            data-ocid={`sprint.card${cardIndex + 1}.view_solution.button`}
            className="outline-btn flex items-center gap-2 w-full justify-center"
            style={{
              minHeight: "40px",
              fontSize: "12px",
              color: "#f59e0b",
              borderColor: "rgba(245,158,11,0.4)",
            }}
            onClick={() => setShowSolution((v) => !v)}
          >
            <Eye size={13} />
            {showSolution ? (
              <>
                <ChevronUp size={12} /> Hide Steps
              </>
            ) : (
              <>
                <ChevronDown size={12} /> View Steps ({solutionSteps.length})
              </>
            )}
          </button>
          {showSolution && (
            <div className="space-y-1 mt-2 animate-fade-in">
              {solutionSteps.map((step, i) => (
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
    </div>
  );
};

// ── Report Card ──────────────────────────────────────────────────────────────
interface ReportCardProps {
  correct: number;
  total: number;
  questionText: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  correct,
  total,
  questionText,
}) => {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const [saved, setSaved] = useState(false);

  const handleSaveToPerms = () => {
    const raw = localStorage.getItem("variant-perms");
    const existing: unknown[] = raw ? JSON.parse(raw) : [];
    const report = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questionText: questionText.slice(0, 200),
      correct,
      total,
      date: new Date().toLocaleString(),
    };
    localStorage.setItem(
      "variant-perms",
      JSON.stringify([report, ...existing]),
    );
    setSaved(true);
    toast.success("Saved to Perms!");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Sprint Report — ${correct}/${total} correct (${Math.round(pct)}%)\n${new Date().toLocaleString()}`,
    );
    toast.success("Copied!");
  };

  return (
    <div
      className="glass-card p-5 space-y-4"
      data-ocid="sprint.report.card"
      style={{
        minWidth: "300px",
        maxWidth: "340px",
        flexShrink: 0,
        scrollSnapAlign: "start",
        border: `1px solid ${color}40`,
      }}
    >
      <div className="flex items-center gap-2">
        <Trophy size={18} style={{ color }} />
        <span className="section-title" style={{ color }}>
          Session Report
        </span>
      </div>

      <div className="text-center space-y-2">
        <p className="text-4xl font-black" style={{ color }}>
          {Math.round(pct)}%
        </p>
        <p className="text-slate-400 text-sm">
          {correct} out of {total} correct
        </p>
      </div>

      <div
        style={{
          height: "8px",
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
            transition: "width 0.8s ease",
          }}
        />
      </div>

      <p className="text-xs text-slate-500 text-center">
        {new Date().toLocaleString()}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          data-ocid="sprint.report.save_button"
          className="cyan-btn flex items-center gap-2 flex-1 justify-center"
          style={{ minHeight: "44px", fontSize: "13px" }}
          onClick={handleSaveToPerms}
          disabled={saved}
        >
          <Trophy size={14} />
          {saved ? "Saved!" : "Save to Perms"}
        </button>
        <button
          type="button"
          data-ocid="sprint.report.copy_button"
          className="outline-btn flex items-center gap-1 px-3"
          style={{ minHeight: "44px", fontSize: "12px" }}
          onClick={handleCopy}
        >
          <Copy size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Main SprintMode ──────────────────────────────────────────────────────────
export const SprintMode: React.FC<SprintModeProps> = ({
  activeQuestion,
  onClearActiveQuestion,
}) => {
  const { actor } = useActor();
  const [questions, setQuestions] = useState<MasterQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] =
    useState<MasterQuestion | null>(activeQuestion ?? null);
  const [useDecimals, setUseDecimals] = useState(false);
  const [cards, setCards] = useState<VariantCard[]>([]);
  const [sessionAnswers, setSessionAnswers] = useState<boolean[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const qs = await actor.listAllMasterQuestions();
      setQuestions(qs.sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch (e) {
      toast.error("Failed to load questions");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Sync activeQuestion prop
  useEffect(() => {
    if (activeQuestion) {
      setSelectedQuestion(activeQuestion);
      onClearActiveQuestion?.();
    }
  }, [activeQuestion, onClearActiveQuestion]);

  const handleGenerateVariants = () => {
    if (!selectedQuestion) return;
    setGenerating(true);
    setSessionAnswers([]);
    try {
      const variants = Array.from({ length: 4 }, (_) =>
        generateVariantQuestion(selectedQuestion.text, useDecimals, false),
      );
      const newCards: VariantCard[] = [
        { type: "original", question: selectedQuestion },
        ...variants.map(
          (v, i): VariantCard => ({
            type: "variant",
            variant: v,
            index: i + 1,
            question: selectedQuestion,
          }),
        ),
        {
          type: "report",
          correct: 0,
          total: 0,
          questionText: selectedQuestion.text,
        },
      ];
      setCards(newCards);
    } catch (e) {
      toast.error("Failed to generate variants");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (cardIndex: number, correct: boolean) => {
    setSessionAnswers((prev) => {
      const updated = [...prev];
      updated[cardIndex] = correct;
      return updated;
    });
    // Update report card
    setCards((prev) =>
      prev.map((c) => {
        if (c.type === "report") {
          const answered = [...sessionAnswers, correct];
          const total = prev.filter(
            (x) => x.type === "original" || x.type === "variant",
          ).length;
          const correctCount = answered.filter(Boolean).length;
          return { ...c, correct: correctCount, total };
        }
        return c;
      }),
    );
  };

  if (loading) {
    return (
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
    );
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <p className="section-title">Sprint Mode</p>
          <h2 className="text-2xl font-bold text-white mt-1">
            Quiz <span className="neon-text">Sprint</span>
          </h2>
        </div>
        <div
          data-ocid="sprint.empty_state"
          className="flex flex-col items-center justify-center py-20 space-y-3"
        >
          <Dumbbell size={48} style={{ color: "rgba(32,230,230,0.3)" }} />
          <p className="text-slate-500 text-lg">No questions yet</p>
          <p className="text-slate-600 text-sm">
            Go to Smart Paste to add questions first
          </p>
        </div>
      </div>
    );
  }

  // Question picker
  if (!selectedQuestion) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <p className="section-title">Sprint Mode</p>
          <h2 className="text-2xl font-bold text-white mt-1">
            Choose a <span className="neon-text">Question</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pick a question to start your sprint
          </p>
        </div>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <button
              type="button"
              key={q.id.toString()}
              data-ocid={`sprint.picker.item.${idx + 1}`}
              className="glass-card glass-card-hover p-4 w-full text-left space-y-2"
              onClick={() => {
                setSelectedQuestion(q);
                setCards([]);
                setSessionAnswers([]);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className="math-text text-white text-sm font-medium leading-relaxed"
                  style={{ maxHeight: "72px", overflowY: "auto", flex: 1 }}
                >
                  {q.text}
                </p>
                <Play
                  size={18}
                  style={{ color: "var(--cyan)", flexShrink: 0 }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="chip">{q.subject}</span>
                <span className="chip">{q.chapter}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Active sprint
  const quizCardCount = cards.filter(
    (c) => c.type === "original" || c.type === "variant",
  ).length;
  const answeredCount = sessionAnswers.filter((a) => a !== undefined).length;
  const correctCount = sessionAnswers.filter(Boolean).length;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="sprint.back.button"
          className="outline-btn flex items-center gap-2"
          style={{ minHeight: "40px", padding: "8px 14px", fontSize: "13px" }}
          onClick={() => {
            setSelectedQuestion(null);
            setCards([]);
            setSessionAnswers([]);
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <p className="section-title">Sprint Mode</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {quizCardCount > 0
              ? `${answeredCount}/${quizCardCount} answered · ${correctCount} correct`
              : "Ready to generate"}
          </p>
        </div>
      </div>

      {/* Selected question */}
      <div
        className="glass-card p-4"
        style={{
          background: "rgba(32,230,230,0.04)",
          border: "1px solid rgba(32,230,230,0.18)",
        }}
      >
        <p className="section-title mb-2">Question</p>
        <p
          className="math-text text-white text-sm leading-relaxed"
          style={{ maxHeight: "128px", overflowY: "auto" }}
        >
          {selectedQuestion.text}
        </p>
      </div>

      {/* Fraction / Decimal toggle */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl"
        style={{
          background: "rgba(16,24,32,0.7)",
          border: "1px solid rgba(32,230,230,0.15)",
          display: "inline-flex",
        }}
      >
        <button
          type="button"
          data-ocid="sprint.fraction.toggle"
          onClick={() => setUseDecimals(false)}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            background: !useDecimals ? "var(--cyan)" : "transparent",
            color: !useDecimals ? "#070b10" : "rgba(154,167,178,0.7)",
            transition: "all 0.2s",
            boxShadow: !useDecimals ? "0 0 12px rgba(32,230,230,0.4)" : "none",
          }}
        >
          Fraction
        </button>
        <button
          type="button"
          data-ocid="sprint.decimal.toggle"
          onClick={() => setUseDecimals(true)}
          style={{
            padding: "8px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            background: useDecimals ? "var(--cyan)" : "transparent",
            color: useDecimals ? "#070b10" : "rgba(154,167,178,0.7)",
            transition: "all 0.2s",
            boxShadow: useDecimals ? "0 0 12px rgba(32,230,230,0.4)" : "none",
          }}
        >
          Decimal
        </button>
      </div>

      {/* Generate button */}
      <button
        type="button"
        data-ocid="sprint.generate.button"
        className="cyan-btn flex items-center gap-2"
        style={{ minHeight: "48px" }}
        onClick={handleGenerateVariants}
        disabled={generating}
      >
        {generating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Zap size={14} />
        )}
        {generating ? "Generating..." : "Generate Variants"}
      </button>

      {/* Horizontal card scroll */}
      {cards.length > 0 && (
        <div
          data-ocid="sprint.cards.list"
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "16px",
            paddingBottom: "16px",
            paddingTop: "4px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((card, i) => {
            if (card.type === "original") {
              const q = card.question;
              // Generate fake MCQ for original using existing question numbers
              const origVariant = generateVariantQuestion(
                q.text,
                useDecimals,
                false,
              );
              return (
                <QuizCard
                  key="card-original"
                  cardIndex={i}
                  questionText={q.text}
                  mcqOptions={origVariant.mcqOptions}
                  correctIndex={origVariant.correctIndex}
                  answer={origVariant.answer}
                  solutionSteps={q.solutionSteps}
                  onAnswer={(correct) => handleAnswer(i, correct)}
                />
              );
            }
            if (card.type === "variant") {
              return (
                <QuizCard
                  key={`variant-${card.index}-${i}`}
                  cardIndex={i}
                  questionText={card.variant.variantText}
                  mcqOptions={card.variant.mcqOptions}
                  correctIndex={card.variant.correctIndex}
                  answer={card.variant.answer}
                  solutionSteps={card.question.solutionSteps}
                  onAnswer={(correct) => handleAnswer(i, correct)}
                />
              );
            }
            if (card.type === "report") {
              return (
                <ReportCard
                  key="card-report"
                  correct={correctCount}
                  total={quizCardCount}
                  questionText={selectedQuestion.text}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default SprintMode;
