import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MoreVertical,
  Save,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MasterQuestion } from "../backend";
import { SlotMachineNumber } from "../components/SlotMachineNumber";
import { useActor } from "../hooks/useActor";
import { generateVariantQuestion } from "../utils/variantGenerator";

const OPTION_LABELS = ["A", "B", "C", "D"];
const QUICK_QUANTITIES = [3, 5, 10, 20];

interface VariantModalProps {
  question: MasterQuestion;
  onClose: () => void;
  onSaved: () => void;
  actor: NonNullable<ReturnType<typeof useActor>["actor"]>;
}

const VariantModal: React.FC<VariantModalProps> = ({
  question,
  onClose,
  onSaved,
  actor,
}) => {
  const [decimalMode, setDecimalMode] = useState(false);
  const [fractionMode, setFractionMode] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [generated, setGenerated] = useState<ReturnType<
    typeof generateVariantQuestion
  > | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const handleGenerate = () => {
    setIsAnimating(true);
    const result = generateVariantQuestion(
      question.text,
      decimalMode,
      fractionMode,
    );
    setGenerated(result);
    setTimeout(() => setIsAnimating(false), 1400);
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    setSaveProgress({ done: 0, total: quantity });

    try {
      const variants = Array.from({ length: quantity }, () =>
        generateVariantQuestion(question.text, decimalMode, fractionMode),
      );

      let done = 0;
      await Promise.all(
        variants.map(async (v) => {
          await actor.createVariant(
            question.id,
            v.variantText,
            v.answer,
            v.mcqOptions,
            BigInt(v.correctIndex),
            decimalMode,
            fractionMode,
          );
          done += 1;
          setSaveProgress({ done, total: quantity });
        }),
      );

      toast.success(
        quantity === 1 ? "Variant saved!" : `${quantity} variants saved!`,
      );
      onSaved();
      onClose();
    } catch (e) {
      toast.error("Failed to save variant(s)");
      console.error(e);
    } finally {
      setSaving(false);
      setSaveProgress(null);
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated.variantText);
    toast.success("Copied to clipboard!");
  };

  const renderVariantText = () => {
    if (!generated) return null;
    const { variantText, numberReplacements } = generated;
    if (numberReplacements.length === 0 || !isAnimating) {
      return (
        <p className="math-text text-slate-200 text-sm leading-relaxed">
          {variantText}
        </p>
      );
    }
    let lastIdx = 0;
    const parts: React.ReactNode[] = [];
    const sorted = [...numberReplacements].sort(
      (a, b) => a.position - b.position,
    );
    for (const rep of sorted) {
      const before = variantText.slice(lastIdx, rep.position);
      parts.push(<span key={`t${rep.position}`}>{before}</span>);
      parts.push(
        <SlotMachineNumber
          key={`n${rep.position}`}
          displayValue={rep.newVal}
          isAnimating={isAnimating}
          className="text-sm"
        />,
      );
      lastIdx = rep.position + rep.newVal.length;
    }
    parts.push(<span key="end">{variantText.slice(lastIdx)}</span>);
    return (
      <p className="math-text text-slate-200 text-sm leading-relaxed">
        {parts}
      </p>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7,11,16,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      tabIndex={-1}
    >
      <div
        data-ocid="variant-modal.dialog"
        className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="section-title">Variant Generator</p>
            <h3 className="text-lg font-bold text-white mt-1">
              Generate New Variant
            </h3>
          </div>
          <button
            type="button"
            data-ocid="variant-modal.close_button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="p-3 rounded-xl"
          style={{
            background: "rgba(32,230,230,0.04)",
            border: "1px solid rgba(32,230,230,0.12)",
          }}
        >
          <p className="text-xs text-slate-500 mb-1">Original Question</p>
          <p className="math-text text-sm text-slate-300">{question.text}</p>
        </div>

        {/* Mode toggles */}
        <div className="space-y-3">
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(16,24,32,0.6)",
              border: "1px solid rgba(32,230,230,0.1)",
            }}
          >
            <div>
              <p className="text-sm font-semibold text-white">Decimal Mode</p>
              <p className="text-xs text-slate-500">
                Allow decimal answers (1-3 places)
              </p>
            </div>
            <button
              type="button"
              data-ocid="variant-modal.decimal_mode.toggle"
              className="touch-target flex items-center"
              onClick={() => setDecimalMode((v) => !v)}
            >
              {decimalMode ? (
                <ToggleRight style={{ color: "var(--cyan)" }} size={28} />
              ) : (
                <ToggleLeft className="text-slate-500" size={28} />
              )}
            </button>
          </div>
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              background: "rgba(16,24,32,0.6)",
              border: "1px solid rgba(32,230,230,0.1)",
            }}
          >
            <div>
              <p className="text-sm font-semibold text-white">Fraction Mode</p>
              <p className="text-xs text-slate-500">
                Display answers as mixed fractions
              </p>
            </div>
            <button
              type="button"
              data-ocid="variant-modal.fraction_mode.toggle"
              className="touch-target flex items-center"
              onClick={() => setFractionMode((v) => !v)}
            >
              {fractionMode ? (
                <ToggleRight style={{ color: "var(--cyan)" }} size={28} />
              ) : (
                <ToggleLeft className="text-slate-500" size={28} />
              )}
            </button>
          </div>
        </div>

        {/* Quantity selector */}
        <div
          className="p-3 rounded-xl space-y-3"
          style={{
            background: "rgba(16,24,32,0.6)",
            border: "1px solid rgba(32,230,230,0.1)",
          }}
        >
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Quantity
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => {
                const v = Math.max(
                  1,
                  Math.min(50, Number(e.target.value) || 1),
                );
                setQuantity(v);
              }}
              data-ocid="variant-modal.quantity.input"
              style={{
                width: "80px",
                minHeight: "48px",
                background: "rgba(10,15,21,0.9)",
                border: "1.5px solid rgba(32,230,230,0.3)",
                borderRadius: "10px",
                color: "#eaf2f7",
                fontSize: "16px",
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
              }}
            />
            <div className="flex gap-2 flex-wrap">
              {QUICK_QUANTITIES.map((q) => (
                <button
                  type="button"
                  key={q}
                  data-ocid={`variant-modal.quantity-${q}.button`}
                  onClick={() => setQuantity(q)}
                  style={{
                    minHeight: "48px",
                    minWidth: "48px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border:
                      quantity === q
                        ? "1.5px solid var(--cyan)"
                        : "1.5px solid rgba(32,230,230,0.25)",
                    background:
                      quantity === q
                        ? "rgba(32,230,230,0.15)"
                        : "rgba(16,24,32,0.6)",
                    color:
                      quantity === q ? "var(--cyan)" : "rgba(154,167,178,0.7)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow:
                      quantity === q ? "0 0 12px rgba(32,230,230,0.3)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          data-ocid="variant-modal.generate.button"
          className="cyan-btn w-full flex items-center justify-center gap-2 py-3 text-base"
          style={{ minHeight: "52px" }}
          onClick={handleGenerate}
        >
          <Zap size={16} />
          Generate Preview
        </button>

        {generated && (
          <div className="space-y-4 animate-fade-in">
            <div
              className="p-4 rounded-xl space-y-2"
              style={{
                background: "rgba(32,230,230,0.05)",
                border: "1px solid rgba(32,230,230,0.2)",
              }}
            >
              <p className="section-title">Generated Preview</p>
              <div className="mt-2">{renderVariantText()}</div>
              <div
                className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(32,230,230,0.1)" }}
              >
                <div>
                  <span className="text-xs text-slate-500 mr-2">Answer:</span>
                  <span className="font-bold" style={{ color: "var(--cyan)" }}>
                    {generated.answer}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="variant-modal.copy.button"
                  className="outline-btn flex items-center gap-1 py-1 px-3 text-xs"
                  onClick={handleCopy}
                >
                  <Copy size={12} /> Quick Copy
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="section-title">Sample MCQ Options</p>
              {generated.mcqOptions.map((opt, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: MCQ options ordered A-D
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: "rgba(16,24,32,0.6)",
                    border: "1px solid rgba(32,230,230,0.15)",
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: "rgba(32,230,230,0.1)",
                      color: "var(--cyan)",
                      border: "1px solid rgba(32,230,230,0.3)",
                    }}
                  >
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="text-sm text-slate-200">{opt}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              data-ocid="variant-modal.save.button"
              className="cyan-btn w-full flex items-center justify-center gap-2"
              style={{ minHeight: "52px" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {saveProgress
                    ? `Saving ${saveProgress.done}/${saveProgress.total}...`
                    : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save {quantity} Variant{quantity !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MyQuestions: React.FC = () => {
  const { actor } = useActor();
  const [questions, setQuestions] = useState<MasterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [variantTarget, setVariantTarget] = useState<MasterQuestion | null>(
    null,
  );
  const [deleting, setDeleting] = useState<bigint | null>(null);
  const [variantCounts, setVariantCounts] = useState<Record<string, number>>(
    {},
  );

  const loadQuestions = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const qs = await actor.listAllMasterQuestions();
      setQuestions(qs.sort((a, b) => Number(b.createdAt - a.createdAt)));
      const counts: Record<string, number> = {};
      await Promise.all(
        qs.map(async (q) => {
          const vs = await actor.listVariantsByMasterId(q.id);
          counts[q.id.toString()] = vs.length;
        }),
      );
      setVariantCounts(counts);
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

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!actor) return;
    if (!term.trim()) {
      loadQuestions();
      return;
    }
    try {
      const [byTopic, byChapter, bySubject] = await Promise.all([
        actor.searchMasterQuestionsByTopic(term),
        actor.searchMasterQuestionsByChapter(term),
        actor.searchMasterQuestionsBySubject(term),
      ]);
      const combined = [...byTopic, ...byChapter, ...bySubject];
      const unique = combined.filter(
        (q, i, arr) => arr.findIndex((x) => x.id === q.id) === i,
      );
      setQuestions(unique.sort((a, b) => Number(b.createdAt - a.createdAt)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    setDeleting(id);
    try {
      await actor.deleteMasterQuestion(id);
      toast.success("Question deleted");
      loadQuestions();
    } catch (e) {
      toast.error("Failed to delete");
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (ts: bigint) =>
    new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="animate-fade-in space-y-6">
      {variantTarget && actor && (
        <VariantModal
          question={variantTarget}
          onClose={() => setVariantTarget(null)}
          onSaved={loadQuestions}
          actor={actor}
        />
      )}

      <div>
        <p className="section-title">Question Bank</p>
        <h2 className="text-2xl font-bold text-white mt-1">
          My <span className="neon-text">Questions</span>
        </h2>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--cyan)" }}
        />
        <input
          type="text"
          data-ocid="questions.search_input"
          className="cyan-input pl-11 text-sm"
          placeholder="Search by topic, chapter, or subject..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ borderRadius: "999px", paddingLeft: "44px" }}
        />
      </div>

      {loading ? (
        <div
          data-ocid="questions.loading_state"
          className="flex items-center justify-center py-20"
        >
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "var(--cyan)" }}
          />
        </div>
      ) : questions.length === 0 ? (
        <div
          data-ocid="questions.empty_state"
          className="flex flex-col items-center justify-center py-20 space-y-3"
        >
          <BookOpen size={48} style={{ color: "rgba(32,230,230,0.3)" }} />
          <p className="text-slate-500 text-lg">No questions yet</p>
          <p className="text-slate-600 text-sm">
            Use Smart Paste to add your first question
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id.toString()}
              data-ocid={`questions.item.${idx + 1}`}
              className="glass-card glass-card-hover p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="math-text text-white text-sm font-medium leading-relaxed"
                    style={{ maxHeight: "100px", overflowY: "auto" }}
                  >
                    {q.text}
                  </p>
                </div>
                {/* Three-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      data-ocid={`questions.item.${idx + 1}.open_modal_button`}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                      aria-label="More options"
                    >
                      <MoreVertical size={16} className="text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="glass-dropdown"
                    style={{
                      background: "rgba(12,18,26,0.95)",
                      border: "1px solid rgba(32,230,230,0.15)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <DropdownMenuItem
                      className="text-red-400 focus:text-red-300 cursor-pointer"
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                    >
                      {deleting === q.id ? (
                        <Loader2 size={14} className="animate-spin mr-2" />
                      ) : (
                        <Trash2 size={14} className="mr-2" />
                      )}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="chip">{q.subject}</span>
                <span className="chip">{q.chapter}</span>
                <span className="chip">{q.topic}</span>
                {variantCounts[q.id.toString()] > 0 && (
                  <span
                    className="chip"
                    style={{
                      background: "rgba(132,100,255,0.1)",
                      border: "1px solid rgba(132,100,255,0.3)",
                      color: "#a78bfa",
                    }}
                  >
                    {variantCounts[q.id.toString()]} variant
                    {variantCounts[q.id.toString()] !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div
                className="flex items-center justify-between pt-2 flex-wrap gap-2"
                style={{ borderTop: "1px solid rgba(32,230,230,0.08)" }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-600">
                    {formatDate(q.createdAt)}
                  </span>
                  {q.solutionSteps.length > 0 && (
                    <button
                      type="button"
                      data-ocid={`questions.solution.toggle.${idx + 1}`}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === q.id ? null : q.id)
                      }
                    >
                      {expandedId === q.id ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                      {expandedId === q.id ? "Hide" : "View"} Solution (
                      {q.solutionSteps.length} steps)
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid={`questions.generate_variant.button.${idx + 1}`}
                  className="cyan-btn flex items-center gap-2 py-2 px-4 text-xs"
                  style={{ minHeight: "48px" }}
                  onClick={() => setVariantTarget(q)}
                >
                  <Zap size={12} />
                  Generate Variant
                </button>
              </div>

              {expandedId === q.id && q.solutionSteps.length > 0 && (
                <div className="space-y-2 pt-2 animate-fade-in">
                  {q.solutionSteps.map((step, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                      key={i}
                      className="flex gap-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(32,230,230,0.03)",
                        border: "1px solid rgba(32,230,230,0.08)",
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "rgba(32,230,230,0.12)",
                          color: "var(--cyan)",
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
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuestions;
