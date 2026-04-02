// Classification Engine for Smart Paste

export interface ClassificationResult {
  subject: string;
  chapter: string;
  topic: string;
  solutionSteps: string[];
  numbers: string[];
}

export function detectSubject(text: string): string {
  const lower = text.toLowerCase();
  const englishKeywords = [
    "grammar",
    "comprehension",
    "vocabulary",
    "synonym",
    "antonym",
    "preposition",
    "noun",
    "verb",
    "adjective",
    "adverb",
    "tense",
    "passage",
    "sentence",
  ];
  const mathKeywords = [
    "profit",
    "loss",
    "speed",
    "distance",
    "time",
    "percentage",
    "ratio",
    "fraction",
    "algebra",
    "geometry",
    "arithmetic",
    "average",
    "interest",
    "work",
    "train",
    "boat",
    "pipe",
    "cistern",
    "angle",
    "triangle",
    "circle",
    "shopkeeper",
    "cost price",
    "selling price",
    "discount",
    "markup",
  ];

  const mathScore = mathKeywords.filter((k) => lower.includes(k)).length;
  const engScore = englishKeywords.filter((k) => lower.includes(k)).length;

  if (engScore > mathScore) return "English";
  return "Mathematics";
}

export function detectChapter(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/profit|loss|cost price|selling price|cp|sp\b/))
    return "Profit & Loss";
  if (
    lower.match(/speed|distance|time|km\/h|m\/s|train|boat|upstream|downstream/)
  )
    return "Time & Distance";
  if (lower.match(/work|pipe|cistern|fill|empty|worker|days/))
    return "Time & Work";
  if (lower.match(/percent|%/)) return "Percentages";
  if (lower.match(/ratio|proportion|part/)) return "Ratios & Proportions";
  if (lower.match(/average|mean/)) return "Averages";
  if (lower.match(/interest|principal|rate|compound|simple interest|si\b|ci\b/))
    return "Simple/Compound Interest";
  if (lower.match(/mixture|alligation/)) return "Mixtures & Alligations";
  if (lower.match(/permutation|combination|probability/)) return "Probability";
  return "General Mathematics";
}

export function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/dishonest|shopkeeper|false weight|cheat/))
    return "Dishonest Shopkeeper";
  if (lower.match(/relative speed|approaching|separating|meet/))
    return "Relative Speed";
  if (lower.match(/upstream|downstream|river|current|still water/))
    return "Upstream/Downstream";
  if (lower.match(/pipe|cistern|leak|fill|tank/)) return "Pipes & Cisterns";
  if (lower.match(/marked price|discount|markup|mp\b|list price/))
    return "Marked Price & Discount";
  if (lower.match(/train|platform|bridge|tunnel/)) return "Train Problems";
  if (lower.match(/compound interest|ci\b/)) return "Compound Interest";
  if (lower.match(/simple interest|si\b/)) return "Simple Interest";
  if (lower.match(/age|years old|older|younger/)) return "Age Problems";
  if (lower.match(/mixture|alloy/)) return "Mixture Problems";
  return "General";
}

export function parseSolution(text: string): string[] {
  // Strip messy math formatting characters
  const cleaned = text
    .replace(/[\*\/\(\)\[\]\{\}\\|`~^]/g, " ")
    .replace(/={2,}/g, "=")
    .replace(/\s{2,}/g, " ")
    .replace(/→|⟹|⇒/g, "=>")
    .trim();

  let steps: string[] = [];

  // Split on explicit step markers
  if (/step\s*\d/i.test(cleaned)) {
    steps = cleaned.split(/(?=step\s*\d)/i).filter((s) => s.trim());
  } else if (/\n\d+[\.)]/i.test(cleaned)) {
    steps = cleaned.split(/\n(?=\d+[\.)\s])/).filter((s) => s.trim());
  } else {
    steps = cleaned.split(/\n+/).filter((s) => s.trim().length > 5);
  }

  // Clean each step and number them
  return steps
    .map((s, i) => {
      const clean = s.replace(/^(?:step\s*\d+[:\.]?|\d+[\.)\s]+)/i, "").trim();
      return `Step ${i + 1}: ${clean}`;
    })
    .filter((s) => s.replace(`Step ${1}: `, "").length > 0)
    .slice(0, 15);
}

export function extractNumbers(text: string): string[] {
  const matches = text.match(/(\d+\.?\d*)/g);
  return matches ? [...new Set(matches)] : [];
}

export function classifyText(text: string): ClassificationResult {
  return {
    subject: detectSubject(text),
    chapter: detectChapter(text),
    topic: detectTopic(text),
    solutionSteps: parseSolution(text),
    numbers: extractNumbers(text),
  };
}
