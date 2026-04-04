import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface FullScreenCard {
  questionText: string;
  mcqOptions: string[];
  correctIndex: number;
  answer: string;
  solutionSteps: string[];
}

interface FullScreenQuizViewProps {
  cards: FullScreenCard[];
  initialIndex: number;
  onClose: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

type AnswerState = { chosen: number; correct: boolean } | null;

const QuizSlide: React.FC<{
  card: FullScreenCard;
  cardIndex: number;
  total: number;
}> = ({ card, cardIndex, total }) => {
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleAnswer = (i: number) => {
    if (answerState !== null) return;
    setAnswerState({ chosen: i, correct: i === card.correctIndex });
  };

  const getOptionStyle = (i: number): React.CSSProperties => {
    if (answerState === null) {
      return {
        background: "rgba(16,24,32,0.7)",
        border: "1.5px solid rgba(32,230,230,0.2)",
        cursor: "pointer",
        transition: "all 0.2s",
      };
    }
    if (i === card.correctIndex) {
      return {
        background: "rgba(32,230,230,0.15)",
        border: "1.5px solid var(--cyan)",
        boxShadow: "0 0 16px rgba(32,230,230,0.3)",
      };
    }
    if (i === answerState.chosen && !answerState.correct) {
      return {
        background: "rgba(239,68,68,0.12)",
        border: "1.5px solid rgba(239,68,68,0.6)",
        boxShadow: "0 0 16px rgba(239,68,68,0.2)",
      };
    }
    return {
      background: "rgba(16,24,32,0.4)",
      border: "1.5px solid rgba(32,230,230,0.06)",
      opacity: 0.45,
    };
  };

  const getCircleStyle = (i: number): React.CSSProperties => {
    if (answerState === null) {
      return {
        background: "rgba(32,230,230,0.1)",
        color: "var(--cyan)",
        border: "1px solid rgba(32,230,230,0.3)",
      };
    }
    if (i === card.correctIndex) {
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
      background: "rgba(32,230,230,0.04)",
      color: "rgba(154,167,178,0.3)",
      border: "1px solid rgba(32,230,230,0.08)",
    };
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ padding: "0 0 env(safe-area-inset-bottom) 0" }}
    >
      {/* Question counter chips */}
      <div
        className="flex items-center gap-1 justify-center mb-4"
        style={{ flexShrink: 0 }}
      >
        {Array.from({ length: total }).map((_, dotIdx) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: ordered dots
            key={dotIdx}
            style={{
              width: dotIdx === cardIndex ? "20px" : "6px",
              height: "6px",
              borderRadius: "99px",
              background:
                dotIdx === cardIndex ? "var(--cyan)" : "rgba(32,230,230,0.2)",
              transition: "all 0.3s ease",
              boxShadow:
                dotIdx === cardIndex ? "0 0 8px rgba(32,230,230,0.6)" : "none",
            }}
          />
        ))}
      </div>

      {/* Question text — scrollable if very long */}
      <div
        style={{
          flex: "0 0 auto",
          maxHeight: "35vh",
          overflowY: "auto",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "rgba(32,230,230,0.04)",
            border: "1px solid rgba(32,230,230,0.15)",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <p
            className="text-white leading-relaxed math-text"
            style={{ fontSize: "16px", lineHeight: "1.7" }}
          >
            {card.questionText}
          </p>
        </div>
      </div>

      {/* MCQ options */}
      <div className="space-y-3" style={{ flex: "0 0 auto" }}>
        {card.mcqOptions.map((opt, i) => (
          <button
            type="button"
            // biome-ignore lint/suspicious/noArrayIndexKey: options ordered A-D
            key={i}
            data-ocid={`fullscreen_quiz.option_${OPTION_LABELS[i].toLowerCase()}.button`}
            className="w-full flex items-center gap-4 rounded-2xl text-left"
            style={{
              ...getOptionStyle(i),
              padding: "16px 18px",
              minHeight: "56px",
              transition: "all 0.25s ease",
            }}
            onClick={() => handleAnswer(i)}
            disabled={answerState !== null}
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
              style={getCircleStyle(i)}
            >
              {OPTION_LABELS[i]}
            </span>
            <span
              className="math-text text-slate-200"
              style={{ fontSize: "15px", flex: 1 }}
            >
              {opt}
            </span>
            {answerState !== null && i === card.correctIndex && (
              <CheckCircle2
                size={18}
                style={{ color: "var(--cyan)", flexShrink: 0 }}
              />
            )}
            {answerState !== null &&
              i === answerState.chosen &&
              !answerState.correct && (
                <XCircle
                  size={18}
                  style={{ color: "#ef4444", flexShrink: 0 }}
                />
              )}
          </button>
        ))}
      </div>

      {/* Result + Solution — revealed after answer */}
      <AnimatePresence>
        {answerState !== null && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
            style={{ marginTop: "20px", flex: "0 0 auto" }}
          >
            {/* Status badge */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: answerState.correct
                  ? "rgba(32,230,230,0.1)"
                  : "rgba(239,68,68,0.1)",
                border: `1px solid ${answerState.correct ? "rgba(32,230,230,0.4)" : "rgba(239,68,68,0.4)"}`,
              }}
            >
              {answerState.correct ? (
                <CheckCircle2 size={20} style={{ color: "var(--cyan)" }} />
              ) : (
                <XCircle size={20} style={{ color: "#ef4444" }} />
              )}
              <div>
                <p
                  className="text-sm font-bold"
                  style={{
                    color: answerState.correct ? "var(--cyan)" : "#ef4444",
                  }}
                >
                  {answerState.correct ? "✓ Correct!" : "✗ Wrong"}
                </p>
                <p className="text-xs text-slate-400">
                  Answer: <strong className="text-white">{card.answer}</strong>
                </p>
              </div>
            </div>

            {/* View Solution toggle */}
            {card.solutionSteps.length > 0 && (
              <div>
                <button
                  type="button"
                  data-ocid="fullscreen_quiz.view_solution.button"
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    color: "#f59e0b",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    minHeight: "48px",
                  }}
                  onClick={() => setShowSolution((v) => !v)}
                >
                  <Eye size={14} />
                  {showSolution ? "Hide Solution" : "View Solution"}
                  {showSolution ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
                <AnimatePresence>
                  {showSolution && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-2 mt-2">
                        {card.solutionSteps.map((step, i) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                            key={i}
                            className="flex gap-3 rounded-xl p-3"
                            style={{
                              background: "rgba(245,158,11,0.06)",
                              border: "1px solid rgba(245,158,11,0.12)",
                            }}
                          >
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: "rgba(245,158,11,0.2)",
                                color: "#f59e0b",
                              }}
                            >
                              {i + 1}
                            </span>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {step.replace(/^Step \d+:\s*/i, "")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FullScreenQuizView: React.FC<FullScreenQuizViewProps> = ({
  cards,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Swipe/drag gesture
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    isDragging.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    // Swipe down to close
    if (dy > 80 && Math.abs(dx) < 60) {
      onClose();
      return;
    }
    // Horizontal swipe navigation
    if (Math.abs(dx) > 50 && Math.abs(dy) < 60) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      <motion.div
        key="fullscreen-quiz"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        ref={containerRef}
        data-ocid="fullscreen_quiz.modal"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "var(--obsidian)",
          display: "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(32,230,230,0.1)",
            flexShrink: 0,
          }}
        >
          {/* Prev arrow */}
          <button
            type="button"
            data-ocid="fullscreen_quiz.prev.button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            style={{
              background: "none",
              border: "1px solid rgba(32,230,230,0.2)",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: currentIndex === 0 ? "default" : "pointer",
              opacity: currentIndex === 0 ? 0.3 : 1,
              color: "var(--cyan)",
              display: "flex",
              alignItems: "center",
              minWidth: "48px",
              minHeight: "48px",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={16} />
          </button>

          {/* Card counter */}
          <div style={{ textAlign: "center" }}>
            <p
              className="neon-text font-black"
              style={{ fontSize: "18px", lineHeight: 1 }}
            >
              {currentIndex + 1}
              <span style={{ color: "rgba(32,230,230,0.4)", fontWeight: 400 }}>
                /{cards.length}
              </span>
            </p>
            <p
              style={{
                fontSize: "10px",
                color: "rgba(154,167,178,0.5)",
                marginTop: "2px",
              }}
            >
              Swipe ↓ to close
            </p>
          </div>

          {/* Next + Close */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              data-ocid="fullscreen_quiz.next.button"
              onClick={goNext}
              disabled={currentIndex === cards.length - 1}
              style={{
                background: "none",
                border: "1px solid rgba(32,230,230,0.2)",
                borderRadius: "12px",
                padding: "10px 14px",
                cursor:
                  currentIndex === cards.length - 1 ? "default" : "pointer",
                opacity: currentIndex === cards.length - 1 ? 0.3 : 1,
                color: "var(--cyan)",
                display: "flex",
                alignItems: "center",
                minWidth: "48px",
                minHeight: "48px",
                justifyContent: "center",
              }}
            >
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              data-ocid="fullscreen_quiz.close_button"
              onClick={onClose}
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "12px",
                padding: "10px 14px",
                cursor: "pointer",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                minWidth: "48px",
                minHeight: "48px",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Slide content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 20px 24px",
            position: "relative",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.2 }}
            >
              <QuizSlide
                card={cards[currentIndex]}
                cardIndex={currentIndex}
                total={cards.length}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullScreenQuizView;
