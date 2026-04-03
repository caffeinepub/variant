# Variant — App Intelligence Upgrade v5

## Current State
- SmartPaste: Large paste area → classifyText() detects Subject/Chapter/Topic. Optional solution paste panel strips filler and extracts numbered steps. Saves to backend. Does NOT auto-navigate to Sprint after save.
- MyQuestions: Shows question cards with `line-clamp-3` (truncated text). Delete uses swipe-to-delete on mobile + a small trash icon on desktop. No three-dot menu.
- VariantModal (inside MyQuestions): Modal generates and saves variants. No card-based horizontal scroll in sprint. No fraction/decimal slider.
- SprintMode: Vertical list of quiz cards. Loads all variants from backend. Static layout, no variant cards from the generation flow.
- classify.ts: parseSolution() does generic step parsing. No awareness of Unit Method / Alligation format.
- variantGenerator.ts: Generates new numeric values, MCQ options, supports decimal/fraction modes.

## Requested Changes (Diff)

### Add
1. **Smart Classifier enhancements (classify.ts)**:
   - `detectType()` function: detects question type like "Zoo/Legs", "Trains", "Mixture/Alligation", "Profit/Loss", "Age", "Work/Pipe", "Speed/Distance" from text keywords.
   - `detectDifficulty()` function: heuristic-based (Easy/Medium/Hard) based on number of distinct numbers, presence of fractions, multi-step complexity.
   - `formatUnitMethodSolution()` function: Reformats solution steps into compact Unit Method / Alligation Strike chain format. Example output: `"Assume all are Pigeons (500×2=1000) → Extra legs (1200-1000=200) → Rabbits (200÷2=100)"`
   - `ClassificationResult` updated to include: `type: string`, `difficulty: string`, `unitMethodSolution: string`

2. **SmartPaste view**:
   - After `handleParse()`, show detected Type and Difficulty badges alongside Subject/Chapter/Topic chips.
   - Show `unitMethodSolution` in the classification result (compact arrow-chain format, not a numbered list).
   - After `handleSave()` succeeds, immediately navigate to Sprint tab (call a new `onSavedAndSprint` callback that switches view to 'sprint').

3. **Sprint Mode redesign (SprintMode.tsx)**:
   - New prop: `activeQuestion?: MasterQuestion` — when set (passed from App after Smart Paste save), Sprint shows that question's full text at top.
   - Full question text displayed at top of Sprint view (not truncated).
   - Fraction/Decimal toggle slider (pill toggle, not a modal) below the question text — toggling re-generates displayed variant values.
   - Variant cards in **horizontal scroll carousel** layout instead of vertical list.
   - Card 1: Original question + clickable MCQ options (green/red glow on answer).
   - Cards 2–5 (or however many generated): new variants with changed values, same logic.
   - Final card: Generation Report card — shows session accuracy (correct/total), saves session summary to a "Perms" (Permanent Record) section.
   - "Generate Variant" button inside Sprint triggers generation of new card set (horizontal scroll).

4. **Perms section**:
   - New nav tab "Perms" (Permanent Records) — shows saved Sprint session reports.
   - Each report: question summary, accuracy score (e.g. 4/5 correct), date.
   - Simple list, no delete needed initially.

5. **MyQuestions UI**:
   - Replace swipe-to-delete + desktop trash icon with a **Three-Dot Menu (⋮)** in the top-right corner of every question card.
   - Dropdown from three-dot: options include "Delete" (red) and "Generate Variant".
   - Question card text: **remove `line-clamp-3`**. Show full text. Card body has `max-h-40 overflow-y-auto` for long questions.

### Modify
1. **classify.ts** — extend `ClassificationResult` interface and `classifyText()` to include type, difficulty, unitMethodSolution.
2. **SmartPaste.tsx** — show new metadata fields; post-save navigation to Sprint tab.
3. **SprintMode.tsx** — complete redesign: horizontal card scroll, fraction/decimal slider, generation report card.
4. **MyQuestions.tsx** — replace delete mechanism with three-dot menu; fix text truncation.
5. **App.tsx** — add `activeSprintQuestion` state, pass to SprintMode; handle `onSavedAndSprint` to switch to sprint with context. Add Perms nav item.

### Remove
- `line-clamp-3` from question card text in MyQuestions.
- Swipe-to-delete (`SwipeableCard` component) — replaced by three-dot menu.
- Desktop trash icon standalone button in question card header.

## Implementation Plan
1. Update `classify.ts`: add detectType(), detectDifficulty(), formatUnitMethodSolution(); update ClassificationResult interface.
2. Update `SmartPaste.tsx`: show type/difficulty badges; display unitMethodSolution arrow-chain; on save, call onSavedAndSprint().
3. Update `App.tsx`: add activeSprintQuestion state; onSavedAndSprint handler; add Perms nav item; pass props to SprintMode.
4. Rewrite `SprintMode.tsx`: accept activeQuestion prop; full-text display; fraction/decimal pill toggle; horizontal scrolling card carousel; Generation Report final card with accuracy summary; Perms save logic.
5. Update `MyQuestions.tsx`: remove SwipeableCard; add three-dot DropdownMenu (⋮) to each card; remove line-clamp; add scrollable card body.
6. Add simple `Perms.tsx` view: lists saved sprint reports from localStorage.
