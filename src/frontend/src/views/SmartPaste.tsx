import {
  ChevronDown,
  ChevronUp,
  Hash,
  Loader2,
  Save,
  Scissors,
  Sparkles,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  type ClassificationResult,
  classifyText,
  formatUnitMethodSolution,
} from "../utils/classify";

interface SmartPasteProps {
  onSaved?: () => void;
  onSavedAndSprint?: () => void;
}

// --- Gemini solution filler patterns to strip ---
const FILLER_PATTERNS = [
  /^Sure[,!][^\n]*\n?/im,
  /^Of course[,!][^\n]*\n?/im,
  /^Here(?:'s| is)[^\n]*\n?/im,
  /^Hope this helps[^\n]*\n?/im,
  /^Let me explain[^\n]*\n?/im,
  /^Great question[^\n]*\n?/im,
  /^Certainly[,!][^\n]*\n?/im,
  /^Absolutely[,!][^\n]*\n?/im,
  /^No problem[,!][^\n]*\n?/im,
  /^I'd be happy[^\n]*\n?/im,
  /^This is a great[^\n]*\n?/im,
  /^Glad you asked[^\n]*\n?/im,
  /^That's a great[^\n]*\n?/im,
  // Closers
  /\nHope that helps[^\n]*$/im,
  /\nLet me know if[^\n]*$/im,
  /\nFeel free to[^\n]*$/im,
  /\nDo let me know[^\n]*$/im,
];

// Formula-bearing line detector
function isCoreLine(line: string): boolean {
  return /[=×÷%\/]|ratio|formula|step|therefore|hence|\d+\s*\/\s*\d+/.test(
    line.toLowerCase(),
  );
}

// Detect and render mixed fraction patterns like "16 2/3%" or "33 1/3"
function renderWithFractions(text: string): React.ReactNode[] {
  const fractionRegex = /(\d+\s+\d+\/\d+%?|\d+\/\d+%?)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: pattern match loop
  while ((match = fractionRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    parts.push(
      <span key={match.index} className="fraction-display">
        {match[0]}
      </span>,
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length > 0 ? parts : [text];
}

function parseGeminiSolution(raw: string): string[] {
  let text = raw;

  for (const pattern of FILLER_PATTERNS) {
    text = text.replace(pattern, "");
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const coreLines = lines.filter(isCoreLine);
  const finalLines = coreLines.length >= 2 ? coreLines : lines;

  return finalLines
    .slice(0, 15)
    .map((l, i) => {
      const clean = l
        .replace(/^(?:step\s*\d+[:.\.\-]?|\d+[.)\s]+)/i, "")
        .trim();
      return `Step ${i + 1}: ${clean}`;
    })
    .filter((s) => s.replace(/^Step \d+: /, "").length > 0);
}

function getDifficultyStyle(difficulty: string): React.CSSProperties {
  if (difficulty === "Easy")
    return {
      background: "rgba(34,197,94,0.1)",
      border: "1px solid rgba(34,197,94,0.3)",
      color: "#22c55e",
    };
  if (difficulty === "Hard")
    return {
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#ef4444",
    };
  // Medium
  return {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b",
  };
}

export const SmartPaste: React.FC<SmartPasteProps> = ({
  onSaved,
  onSavedAndSprint,
}) => {
  const { actor } = useActor();
  const [pasteText, setPasteText] = useState("");
  const [classification, setClassification] =
    useState<ClassificationResult | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState(false);

  const [showSolutionPaste, setShowSolutionPaste] = useState(false);
  const [solutionRaw, setSolutionRaw] = useState("");
  const [cleanedSteps, setCleanedSteps] = useState<string[]>([]);
  const [showCleanedSteps, setShowCleanedSteps] = useState(false);

  const handleParse = () => {
    if (!pasteText.trim()) {
      toast.error("Please paste some content first");
      return;
    }
    const result = classifyText(pasteText);
    setClassification(result);
    setParsed(true);
  };

  const handleCleanSolution = () => {
    if (!solutionRaw.trim()) {
      toast.error("Please paste a Gemini solution first");
      return;
    }
    const steps = parseGeminiSolution(solutionRaw);
    if (steps.length === 0) {
      toast.error("Could not extract any formula/calculation lines");
      return;
    }
    setCleanedSteps(steps);
    setShowCleanedSteps(true);
    if (classification) {
      const unitMethod = formatUnitMethodSolution(steps);
      setClassification({
        ...classification,
        solutionSteps: steps,
        unitMethodSolution: unitMethod,
      });
    }
    toast.success(`Extracted ${steps.length} solution steps`);
  };

  const handleSave = async () => {
    if (!actor || !classification) return;
    setSaving(true);
    try {
      const lines = pasteText.split("\n");
      const questionText =
        lines.slice(0, 3).join(" ").trim() || pasteText.slice(0, 300);

      const stepsToSave =
        cleanedSteps.length > 0 ? cleanedSteps : classification.solutionSteps;

      await actor.createMasterQuestion(
        questionText,
        classification.subject,
        classification.chapter,
        classification.topic,
        stepsToSave,
        classification.numbers,
      );
      toast.success("Question saved! Opening Sprint...");
      setPasteText("");
      setSolutionRaw("");
      setClassification(null);
      setCleanedSteps([]);
      setParsed(false);
      setShowSolutionPaste(false);
      setShowCleanedSteps(false);
      onSavedAndSprint?.();
      onSaved?.();
    } catch (e) {
      toast.error("Failed to save question");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="section-title">Smart Paste Engine</p>
        <h2 className="text-2xl font-bold text-white mt-1">
          Paste &amp; <span className="neon-text">Classify</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Paste any Gemini response — the engine auto-detects subject, chapter,
          topic, and parses the solution.
        </p>
      </div>

      {/* Main paste area */}
      <div className="glass-card p-5 space-y-4">
        <p className="section-title flex items-center gap-2">
          <Sparkles size={13} />
          Input
        </p>
        <textarea
          id="paste-area"
          data-ocid="smartpaste.textarea"
          className="cyan-input resize-none math-text"
          rows={8}
          placeholder="PASTE GEMINI RESPONSE HERE... The app auto-detects Subject, Chapter, Topic and parses solution steps."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            data-ocid="smartpaste.parse.button"
            className="cyan-btn flex items-center gap-2"
            style={{ minHeight: "48px" }}
            onClick={handleParse}
          >
            <Sparkles size={14} />
            Parse &amp; Classify
          </button>
          {parsed && (
            <button
              type="button"
              data-ocid="smartpaste.clear.button"
              className="outline-btn"
              style={{ minHeight: "48px" }}
              onClick={() => {
                setPasteText("");
                setClassification(null);
                setParsed(false);
                setSolutionRaw("");
                setCleanedSteps([]);
                setShowSolutionPaste(false);
                setShowCleanedSteps(false);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Gemini Solution Parser — expandable */}
      <div className="glass-card overflow-hidden">
        <button
          type="button"
          data-ocid="smartpaste.solution_paste.toggle"
          className="w-full flex items-center justify-between p-5"
          onClick={() => setShowSolutionPaste((v) => !v)}
        >
          <p className="section-title flex items-center gap-2">
            <Scissors size={13} />
            Add Solution (Gemini Paste)
          </p>
          {showSolutionPaste ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>

        {showSolutionPaste && (
          <div className="px-5 pb-5 space-y-4 animate-fade-in">
            <p className="text-xs text-slate-500">
              Paste a long Gemini explanation. The parser will strip filler text
              and extract only the core formula and calculation steps.
            </p>
            <textarea
              data-ocid="smartpaste.solution.textarea"
              className="cyan-input resize-none math-text"
              rows={7}
              placeholder="Paste Gemini solution here..."
              value={solutionRaw}
              onChange={(e) => setSolutionRaw(e.target.value)}
            />
            <button
              type="button"
              data-ocid="smartpaste.clean_solution.button"
              className="cyan-btn flex items-center gap-2"
              style={{ minHeight: "48px" }}
              onClick={handleCleanSolution}
            >
              <Scissors size={14} />
              Clean &amp; Apply
            </button>

            {showCleanedSteps && cleanedSteps.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Cleaned Solution ({cleanedSteps.length} steps)
                </p>
                {cleanedSteps.map((step, i) => {
                  const text = step.replace(/^Step \d+:\s*/i, "");
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                      key={i}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(32,230,230,0.04)",
                        border: "1px solid rgba(32,230,230,0.1)",
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "rgba(32,230,230,0.15)",
                          color: "var(--cyan)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {renderWithFractions(text)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {classification && (
        <div className="animate-fade-in space-y-4">
          {/* Classification result */}
          <div className="glass-card p-5 space-y-4">
            <p className="section-title">Classification Result</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="chip-label">Subject</span>
                <span className="chip">{classification.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip-label">Chapter</span>
                <span className="chip">{classification.chapter}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip-label">Topic</span>
                <span className="chip">{classification.topic}</span>
              </div>
              {/* Type chip — purple */}
              <div className="flex items-center gap-2">
                <span className="chip-label">Type</span>
                <span
                  className="chip"
                  style={{
                    background: "rgba(132,100,255,0.1)",
                    border: "1px solid rgba(132,100,255,0.3)",
                    color: "#a78bfa",
                    textShadow: "none",
                  }}
                >
                  {classification.type}
                </span>
              </div>
              {/* Difficulty chip — color-coded */}
              <div className="flex items-center gap-2">
                <span className="chip-label">Difficulty</span>
                <span
                  className="chip"
                  style={{
                    ...getDifficultyStyle(classification.difficulty),
                    textShadow: "none",
                  }}
                >
                  {classification.difficulty}
                </span>
              </div>
            </div>

            {classification.numbers.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                  <Hash size={11} />
                  Extracted Numbers
                </p>
                <div className="flex flex-wrap gap-2">
                  {classification.numbers.map((n) => (
                    <span
                      key={n}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: "rgba(32,230,230,0.08)",
                        color: "var(--cyan)",
                        border: "1px solid rgba(32,230,230,0.25)",
                        fontFamily: "monospace",
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Unit Method Solution — primary display */}
          {classification.unitMethodSolution && (
            <div className="glass-card p-5 space-y-3">
              <p className="section-title">Unit Method Solution</p>
              <div
                style={{
                  background: "rgba(32,230,230,0.06)",
                  border: "1px solid rgba(32,230,230,0.18)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontFamily: "monospace",
                  color: "#20E6E6",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {classification.unitMethodSolution}
              </div>

              {/* Full Steps — collapsible, secondary */}
              {classification.solutionSteps.length > 0 && (
                <div>
                  <button
                    type="button"
                    data-ocid="smartpaste.solution_steps.toggle"
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setShowSteps((v) => !v)}
                  >
                    {showSteps ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    {showSteps ? "Hide" : "View"} Full Steps (
                    {classification.solutionSteps.length})
                  </button>
                  {showSteps && (
                    <div className="space-y-2 mt-3 animate-fade-in">
                      {classification.solutionSteps.map((step, i) => {
                        const text = step.replace(/^Step \d+:\s*/i, "");
                        return (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                            key={i}
                            className="flex gap-3 p-3 rounded-xl"
                            style={{
                              background: "rgba(32,230,230,0.04)",
                              border: "1px solid rgba(32,230,230,0.1)",
                            }}
                          >
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                background: "rgba(32,230,230,0.15)",
                                color: "var(--cyan)",
                              }}
                            >
                              {i + 1}
                            </span>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {renderWithFractions(text)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            data-ocid="smartpaste.save.button"
            className="cyan-btn flex items-center gap-2 w-full justify-center text-base py-3"
            style={{ minHeight: "52px" }}
            onClick={handleSave}
            disabled={saving || !actor}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save & Open Sprint"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartPaste;
