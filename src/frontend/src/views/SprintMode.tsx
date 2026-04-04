import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Dumbbell,
  Eye,
  Folder,
  FolderOpen,
  Loader2,
  Play,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MasterQuestion } from "../backend";
import {
  type FullScreenCard,
  FullScreenQuizView,
} from "../components/FullScreenQuizView";
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

// ── Nested Folder Hierarchy ──────────────────────────────────────────────────
interface TopicGroup {
  topic: string;
  chapters: ChapterGroup[];
  totalCount: number;
}

interface ChapterGroup {
  chapter: string;
  questions: MasterQuestion[];
}

function buildHierarchy(questions: MasterQuestion[]): TopicGroup[] {
  const topicMap = new Map<string, Map<string, MasterQuestion[]>>();

  for (const q of questions) {
    const topic = q.topic || "General";
    const chapter = q.chapter || "General";
    if (!topicMap.has(topic)) topicMap.set(topic, new Map());
    const chapterMap = topicMap.get(topic)!;
    if (!chapterMap.has(chapter)) chapterMap.set(chapter, []);
    chapterMap.get(chapter)!.push(q);
  }

  return Array.from(topicMap.entries()).map(([topic, chapterMap]) => ({
    topic,
    chapters: Array.from(chapterMap.entries()).map(([chapter, qs]) => ({
      chapter,
      questions: qs,
    })),
    totalCount: Array.from(chapterMap.values()).reduce(
      (sum, qs) => sum + qs.length,
      0,
    ),
  }));
}

function buildFullScreenCards(
  questions: MasterQuestion[],
  useDecimals: boolean,
): FullScreenCard[] {
  return questions.map((q) => {
    const variant = generateVariantQuestion(q.text, useDecimals, false);
    return {
      questionText: q.text,
      mcqOptions: variant.mcqOptions,
      correctIndex: variant.correctIndex,
      answer: variant.answer,
      solutionSteps: q.solutionSteps,
    };
  });
}

interface FolderTreeProps {
  hierarchy: TopicGroup[];
  onOpenQuestion: (cards: FullScreenCard[], initialIndex: number) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  hierarchy,
  onOpenQuestion,
}) => {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(),
  );

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {hierarchy.map((topicGroup, tIdx) => {
        const isTopicOpen = expandedTopics.has(topicGroup.topic);
        return (
          <div
            key={topicGroup.topic}
            className="glass-card overflow-hidden"
            data-ocid={`sprint.topic.item.${tIdx + 1}`}
            style={{
              border: isTopicOpen
                ? "1px solid rgba(32,230,230,0.25)"
                : "1px solid rgba(32,230,230,0.1)",
              transition: "border-color 0.2s",
            }}
          >
            {/* Topic row (Level 1) */}
            <button
              type="button"
              data-ocid={`sprint.topic_${tIdx + 1}.toggle`}
              className="w-full flex items-center gap-3 p-4"
              style={{
                background: isTopicOpen
                  ? "rgba(32,230,230,0.06)"
                  : "transparent",
                cursor: "pointer",
                border: "none",
                transition: "background 0.2s",
                minHeight: "56px",
              }}
              onClick={() => toggleTopic(topicGroup.topic)}
            >
              <span
                style={{
                  color: isTopicOpen ? "var(--cyan)" : "rgba(154,167,178,0.7)",
                }}
              >
                {isTopicOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
              </span>
              <span
                className="flex-1 text-left"
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: isTopicOpen ? "var(--cyan)" : "#eaf2f7",
                  letterSpacing: "-0.01em",
                }}
              >
                {topicGroup.topic}
              </span>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: isTopicOpen
                    ? "rgba(32,230,230,0.15)"
                    : "rgba(154,167,178,0.1)",
                  color: isTopicOpen ? "var(--cyan)" : "rgba(154,167,178,0.6)",
                  fontWeight: 700,
                }}
              >
                {topicGroup.totalCount}
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: isTopicOpen ? "var(--cyan)" : "rgba(154,167,178,0.4)",
                  transform: isTopicOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              />
            </button>

            {/* Topic expanded content */}
            <AnimatePresence>
              {isTopicOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      borderTop: "1px solid rgba(32,230,230,0.08)",
                      paddingTop: "4px",
                      paddingBottom: "4px",
                    }}
                  >
                    {topicGroup.chapters.map((chapterGroup, cIdx) => {
                      const chapterKey = `${topicGroup.topic}__${chapterGroup.chapter}`;
                      const isChapterOpen = expandedChapters.has(chapterKey);
                      return (
                        <div
                          key={chapterKey}
                          data-ocid={`sprint.chapter.item.${cIdx + 1}`}
                        >
                          {/* Chapter row (Level 2) */}
                          <button
                            type="button"
                            data-ocid={`sprint.chapter_${cIdx + 1}.toggle`}
                            className="w-full flex items-center gap-3"
                            style={{
                              padding: "10px 16px 10px 32px",
                              background: isChapterOpen
                                ? "rgba(167,139,250,0.06)"
                                : "transparent",
                              border: "none",
                              cursor: "pointer",
                              transition: "background 0.2s",
                              minHeight: "48px",
                            }}
                            onClick={() => toggleChapter(chapterKey)}
                          >
                            <ChevronRight
                              size={13}
                              style={{
                                color: isChapterOpen
                                  ? "#a78bfa"
                                  : "rgba(154,167,178,0.4)",
                                transform: isChapterOpen
                                  ? "rotate(90deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                                flexShrink: 0,
                              }}
                            />
                            <Folder
                              size={14}
                              style={{
                                color: isChapterOpen
                                  ? "#a78bfa"
                                  : "rgba(154,167,178,0.5)",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              className="flex-1 text-left"
                              style={{
                                fontSize: "13px",
                                fontWeight: isChapterOpen ? 700 : 500,
                                color: isChapterOpen
                                  ? "#a78bfa"
                                  : "rgba(154,167,178,0.8)",
                              }}
                            >
                              {chapterGroup.chapter}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(167,139,250,0.12)",
                                color: "rgba(167,139,250,0.8)",
                                fontWeight: 700,
                              }}
                            >
                              {chapterGroup.questions.length}
                            </span>
                          </button>

                          {/* Questions (Level 3) */}
                          <AnimatePresence>
                            {isChapterOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: "easeOut",
                                }}
                                style={{ overflow: "hidden" }}
                              >
                                <div
                                  style={{
                                    borderTop:
                                      "1px solid rgba(167,139,250,0.08)",
                                  }}
                                >
                                  {chapterGroup.questions.map((q, qIdx) => (
                                    <button
                                      type="button"
                                      key={q.id.toString()}
                                      data-ocid={`sprint.question.item.${qIdx + 1}`}
                                      className="w-full flex items-center gap-3 text-left"
                                      style={{
                                        padding: "12px 16px 12px 52px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        borderBottom:
                                          qIdx <
                                          chapterGroup.questions.length - 1
                                            ? "1px solid rgba(255,255,255,0.04)"
                                            : "none",
                                        minHeight: "52px",
                                        transition: "background 0.15s",
                                      }}
                                      onClick={() => {
                                        const allCards = buildFullScreenCards(
                                          chapterGroup.questions,
                                          false,
                                        );
                                        onOpenQuestion(allCards, qIdx);
                                      }}
                                      onMouseEnter={(e) => {
                                        (
                                          e.currentTarget as HTMLButtonElement
                                        ).style.background =
                                          "rgba(255,255,255,0.03)";
                                      }}
                                      onMouseLeave={(e) => {
                                        (
                                          e.currentTarget as HTMLButtonElement
                                        ).style.background = "transparent";
                                      }}
                                    >
                                      <p
                                        className="flex-1 text-slate-400 math-text"
                                        style={{
                                          fontSize: "12px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {q.text}
                                      </p>
                                      <Play
                                        size={14}
                                        style={{
                                          color: "rgba(32,230,230,0.5)",
                                          flexShrink: 0,
                                        }}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
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

  // FullScreen quiz state
  const [fsCards, setFsCards] = useState<FullScreenCard[]>([]);
  const [fsInitialIndex, setFsInitialIndex] = useState(0);
  const [fsOpen, setFsOpen] = useState(false);

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

  const handleOpenFullScreen = (fCards: FullScreenCard[], idx: number) => {
    setFsCards(fCards);
    setFsInitialIndex(idx);
    setFsOpen(true);
  };

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

  const hierarchy = buildHierarchy(questions);

  // Active sprint from SmartPaste navigation (selectedQuestion path)
  if (selectedQuestion) {
    const quizCardCount = cards.filter(
      (c) => c.type === "original" || c.type === "variant",
    ).length;
    const answeredCount = sessionAnswers.filter((a) => a !== undefined).length;
    const correctCount = sessionAnswers.filter(Boolean).length;

    return (
      <div className="animate-fade-in space-y-5">
        {/* Full-screen quiz overlay */}
        {fsOpen && (
          <FullScreenQuizView
            cards={fsCards}
            initialIndex={fsInitialIndex}
            onClose={() => setFsOpen(false)}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="sprint.back.button"
            className="outline-btn flex items-center gap-2"
            style={{
              minHeight: "40px",
              padding: "8px 14px",
              fontSize: "13px",
            }}
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
              boxShadow: !useDecimals
                ? "0 0 12px rgba(32,230,230,0.4)"
                : "none",
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
  }

  // Default: Nested folder hierarchy view
  return (
    <div className="animate-fade-in space-y-6">
      {/* Full-screen quiz overlay */}
      {fsOpen && (
        <FullScreenQuizView
          cards={fsCards}
          initialIndex={fsInitialIndex}
          onClose={() => setFsOpen(false)}
        />
      )}

      <div>
        <p className="section-title">Sprint Mode</p>
        <h2 className="text-2xl font-bold text-white mt-1">
          Question <span className="neon-text">Library</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {questions.length} questions across {hierarchy.length} topics
        </p>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-4 p-3 rounded-xl"
        style={{
          background: "rgba(32,230,230,0.03)",
          border: "1px solid rgba(32,230,230,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <FolderOpen size={13} style={{ color: "var(--cyan)" }} />
          <span className="text-xs text-slate-400">Topic</span>
        </div>
        <div className="flex items-center gap-2">
          <Folder size={12} style={{ color: "#a78bfa" }} />
          <span className="text-xs text-slate-400">Chapter</span>
        </div>
        <div className="flex items-center gap-2">
          <Play size={12} style={{ color: "rgba(32,230,230,0.5)" }} />
          <span className="text-xs text-slate-400">Open in full-screen</span>
        </div>
      </div>

      <FolderTree hierarchy={hierarchy} onOpenQuestion={handleOpenFullScreen} />
    </div>
  );
};

export default SprintMode;
