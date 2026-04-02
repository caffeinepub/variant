// Variant Generator Logic

export interface VariantResult {
  variantText: string;
  answer: string;
  answerNumeric: number;
  mcqOptions: string[];
  correctIndex: number;
  fractionAnswer?: string;
  numberReplacements: { old: string; newVal: string; position: number }[];
}

// Converts decimal to mixed fraction string e.g. 2.333... => "2 1/3"
export function toMixedFraction(decimal: number): string {
  if (Number.isInteger(decimal)) return `${decimal}`;

  const tolerance = 1.0e-6;
  let h1 = 1;
  let h2 = 0;
  let k1 = 0;
  let k2 = 1;
  let b = decimal;

  do {
    const a = Math.floor(b);
    const auxH = h1;
    h1 = a * h1 + h2;
    h2 = auxH;
    const auxK = k1;
    k1 = a * k1 + k2;
    k2 = auxK;
    b = 1 / (b - a);
  } while (Math.abs(decimal - h1 / k1) > decimal * tolerance && k1 < 10000);

  const numerator = h1;
  const denominator = k1;

  if (denominator === 1) return `${numerator}`;

  const wholePart = Math.floor(Math.abs(numerator / denominator));
  const remainder = Math.abs(numerator) % denominator;
  const sign = decimal < 0 ? "-" : "";

  if (wholePart === 0) return `${sign}${remainder}/${denominator}`;
  if (remainder === 0) return `${sign}${wholePart}`;
  return `${sign}${wholePart} ${remainder}/${denominator}`;
}

function getCleanReplacementInt(original: number): number {
  const n = Math.round(original);
  if (n === 0) return Math.floor(Math.random() * 9) + 1;

  const multipliers = [
    0.5, 0.6, 0.75, 0.8, 1.2, 1.25, 1.5, 1.6, 1.75, 2.0, 2.5,
  ];
  const candidates = multipliers
    .map((m) => Math.round(n * m))
    .filter((c) => c > 0 && c !== n && c < 10000);

  for (let i = 0; i < 5; i++) {
    const r = Math.floor(n * (0.5 + Math.random() * 1.5));
    if (r > 0 && r !== n) candidates.push(r);
  }

  if (candidates.length === 0) return n + Math.floor(Math.random() * 10) + 1;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function getDecimalReplacement(original: number): number {
  const decimalPlaces = Math.floor(Math.random() * 3) + 1;
  const factor = 10 ** decimalPlaces;
  const min = Math.max(1, Math.round(original * 0.5 * factor));
  const max = Math.round(original * 2.0 * factor);
  const raw = min + Math.floor(Math.random() * (max - min + 1));
  return raw / factor;
}

function generateSmartDistractors(
  correct: number,
  decimalMode: boolean,
): number[] {
  const round = (n: number) =>
    decimalMode ? Math.round(n * 100) / 100 : Math.round(n);

  const distractors: number[] = [
    round(correct * 1.1),
    round(correct * 0.9),
    round(correct * 1.25),
    round(correct * 0.75),
    round(correct + correct * 0.15),
    round(correct - correct * 0.15),
    round(correct * 2),
    round(correct / 2),
  ];

  return [...new Set(distractors)]
    .filter((d) => d !== correct && d > 0)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}

export function generateVariantQuestion(
  originalText: string,
  decimalMode: boolean,
  fractionMode: boolean,
): VariantResult {
  const numberRegex = /(\d+\.?\d*)/g;
  const positions: { value: string; index: number; end: number }[] = [];

  let match = numberRegex.exec(originalText);
  while (match !== null) {
    positions.push({
      value: match[1],
      index: match.index,
      end: match.index + match[1].length,
    });
    match = numberRegex.exec(originalText);
  }

  if (positions.length === 0) {
    return {
      variantText: `${originalText} [No numbers found to vary]`,
      answer: "N/A",
      answerNumeric: 0,
      mcqOptions: ["N/A", "N/A", "N/A", "N/A"],
      correctIndex: 0,
      numberReplacements: [],
    };
  }

  const replacements = positions.map((pos) => {
    const orig = Number.parseFloat(pos.value);
    const newVal = decimalMode
      ? getDecimalReplacement(orig)
      : getCleanReplacementInt(orig);
    return {
      old: pos.value,
      newVal: decimalMode ? newVal.toString() : Math.round(newVal).toString(),
      position: pos.index,
    };
  });

  let variantText = originalText;
  const sortedPositions = [...positions].reverse();
  const sortedReplacements = [...replacements].reverse();

  for (let i = 0; i < sortedPositions.length; i++) {
    const pos = sortedPositions[i];
    const rep = sortedReplacements[i];
    variantText = `${variantText.slice(0, pos.index)}${rep.newVal}${variantText.slice(pos.end)}`;
  }

  const firstOrig = Number.parseFloat(positions[0].value);
  const firstNew = Number.parseFloat(replacements[0].newVal);
  const ratio = firstOrig > 0 ? firstNew / firstOrig : 1;

  const lastNumber = Number.parseFloat(positions[positions.length - 1].value);
  let answerNumeric = Math.round(lastNumber * ratio * 100) / 100;
  if (!decimalMode) answerNumeric = Math.round(answerNumeric);

  const answerStr = fractionMode
    ? toMixedFraction(answerNumeric)
    : decimalMode
      ? answerNumeric.toFixed(2)
      : answerNumeric.toString();

  const distractors = generateSmartDistractors(answerNumeric, decimalMode);
  const allOptions = [answerNumeric, ...distractors.slice(0, 3)];

  const shuffled = allOptions
    .map((val, i) => ({ val, orig: i === 0 }))
    .sort(() => Math.random() - 0.5);

  const correctIndex = shuffled.findIndex((o) => o.orig);
  const mcqOptions = shuffled.map((o) => {
    const v = o.val;
    if (fractionMode) return toMixedFraction(v);
    if (decimalMode) return v.toFixed(2);
    return Math.round(v).toString();
  });

  return {
    variantText,
    answer: answerStr,
    answerNumeric,
    mcqOptions,
    correctIndex,
    fractionAnswer: fractionMode ? toMixedFraction(answerNumeric) : undefined,
    numberReplacements: replacements,
  };
}
