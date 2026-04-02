import type React from "react";
import { useEffect, useRef, useState } from "react";

interface SlotMachineNumberProps {
  displayValue: string;
  isAnimating: boolean;
  className?: string;
}

const DIGITS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];

export const SlotMachineNumber: React.FC<SlotMachineNumberProps> = ({
  displayValue,
  isAnimating,
  className = "",
}) => {
  const [settled, setSettled] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAnimating) {
      setSettled(false);
      setAnimKey((k) => k + 1);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSettled(true), 1200);
    } else {
      setSettled(true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  if (settled || !isAnimating) {
    return (
      <span
        className={className}
        style={{
          color: "var(--cyan)",
          textShadow: "0 0 10px rgba(32,230,230,0.8)",
          fontWeight: 700,
        }}
      >
        {displayValue}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: "1px" }}>
      {displayValue.split("").map((char, idx) => {
        const charKey = `${animKey}-c${idx}`;
        if (char === "." || char === " ") {
          return (
            <span
              key={charKey}
              style={{ color: "var(--cyan)", fontWeight: 700 }}
            >
              {char}
            </span>
          );
        }
        return (
          <span
            key={charKey}
            style={{
              display: "inline-block",
              height: "1.2em",
              overflow: "hidden",
              verticalAlign: "middle",
            }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                animation: `slotRoll ${0.9 + idx * 0.1}s cubic-bezier(0.2,0.8,0.4,1) forwards`,
                color: "var(--cyan)",
                textShadow: "0 0 10px rgba(32,230,230,0.8)",
                fontWeight: 700,
                lineHeight: "1.2em",
              }}
            >
              {DIGITS.map((d, di) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: static digit list
                  key={di}
                  style={{
                    display: "block",
                    height: "1.2em",
                    textAlign: "center",
                    minWidth: "0.6em",
                  }}
                >
                  {d}
                </span>
              ))}
              <span
                style={{
                  display: "block",
                  height: "1.2em",
                  textAlign: "center",
                  minWidth: "0.6em",
                }}
              >
                {char}
              </span>
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default SlotMachineNumber;
