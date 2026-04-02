# Variant — Mobile Precision & Persistent Storage Upgrade

## Current State
- Desktop sidebar layout with 240px fixed sidebar; no responsive/mobile layout
- Variant Generator is a modal dialog with single-generate flow (no batch, no quantity selector)
- SprintMode QuizCard shows correct answer highlighted before user selects any option (anti-spoiler bug)
- SmartPaste only has a 'Parse & Classify' field, no dedicated 'Add Solution' cleaning field
- MyQuestions uses a delete button in the card header; no swipe-to-delete gesture
- Settings has basic Export/Import but no dual-layer storage (no IndexedDB, no linked folder, no sync icon)
- No auto-save debounce, no timestamping, no anti-corruption check
- No sync status indicator anywhere in the UI
- App.tsx uses a fixed sidebar that would create layout issues on mobile

## Requested Changes (Diff)

### Add
- **Mobile-first responsive layout**: On screens < 768px, collapse sidebar into a bottom tab bar; question cards take full screen width; buttons min 48px height
- **Math equation wrapping**: Apply `overflow-wrap: break-word; word-break: break-word; white-space: pre-wrap` to all question text containers to prevent horizontal scroll
- **Variant Quantity Selector**: In the VariantModal (MyQuestions.tsx), add next to the Generate button: a numeric input field (default 1) AND a row of quick-select chips [3][5][10][20]. Batch generation: clicking a chip or entering a number and generating creates N unique variants in one click and saves them all
- **Anti-Spoiler Fix (SprintMode)**: In QuizCard, before any answer is selected, ALL options must render with neutral style. The `getOptionStyle` function currently highlights the correct answer immediately after reveal — this must only apply AFTER the user has tapped an option (`answer !== null`). Verify the current logic is correct (it checks `if (!answer)` first, which is correct) — but ensure no correct-answer styling bleeds through before tap
- **'View Solution' button**: After answering in SprintMode, show a 'View Solution' button at the bottom of the card for BOTH correct AND incorrect answers (currently solution shortcut only shows when wrong)
- **'Add Solution' field in SmartPaste**: Add a second textarea labeled 'Add Solution (Gemini Paste)'. When user pastes a Gemini response here, strip filler phrases ('Sure! Here is...', 'Hope this helps!', 'Of course!', etc.), extract core formula and Unit/Ratio steps, and display them in the Sovereign Solution View. Mixed fractions like '16 2/3%' must be preserved and displayed in large readable math text
- **Swipe-to-delete on MyQuestions**: Implement touch swipe-left gesture on each question card to reveal a red Delete button (similar to iOS list swipe). On non-touch devices, the existing trash icon button remains
- **Dual-Layer Storage Engine**:
  - Layer 1: Use IndexedDB (via idb-keyval or raw IndexedDB API) to auto-save all questions/variants data on every change with 2-second debounce
  - Layer 2: File System Access API — add 'Link to Local Folder' button in Settings. When linked, auto-save pushes a JSON file to the chosen folder on every debounced save
- **Safe-Load Initialization**: On app load, check IndexedDB for saved data and auto-populate the UI before user can interact
- **Debounced Auto-Save**: 2-second debounce on any data change triggers save to IndexedDB + linked folder (if linked)
- **Timestamping**: Every save payload includes `lastModified: ISO timestamp`
- **Anti-Corruption**: Before any file write, check the data is non-empty; if empty, abort and alert
- **Export Backup / Import Backup buttons**: Add to Settings (rename existing Export/Import to match this naming)
- **Sync Status Icon**: Small glowing dot in the top-right of the header — Green (saved to folder), Yellow (saved to browser only), Red (save failed or permission needed). Show tooltip on hover

### Modify
- `App.tsx`: Add responsive layout. On mobile (< 768px): hide the sidebar, show a bottom navigation bar with icons + labels. On desktop: keep existing sidebar. Add SyncStatusIcon component to the header top-right.
- `MyQuestions.tsx / VariantModal`: Replace single-generate flow with quantity-aware batch generation. Add quantity input + chips. Save N variants in parallel with a single 'Generate & Save [N] Variants' button.
- `SprintMode.tsx / QuizCard`: Fix solution visibility — show View Solution button after any answer (correct OR wrong). Ensure option styling is strictly gated behind `answer !== null`.
- `SmartPaste.tsx`: Add a second 'Add Solution' textarea with Gemini filler stripper. Display mixed fraction results in larger styled text.
- `Settings.tsx`: Add 'Link to Local Folder' button using File System Access API (directory picker). Add sync status. Rename export/import buttons to 'Export Backup' / 'Import Backup'.
- `index.css`: Add `min-h-[48px]` equivalent CSS rules for touch targets. Add mobile layout styles. Add sync icon animations (green-glow, yellow-glow, red-pulse keyframes). Add word-wrap rules for question text.

### Remove
- The auto-show solution on incorrect answer in SprintMode (the `setTimeout(() => setShowSolution(true), 400)` that auto-opens solution). Replace with explicit 'View Solution' button visible to both correct and incorrect answers.

## Implementation Plan
1. Create a `useStorage` hook (`src/frontend/src/hooks/useStorage.ts`) that manages IndexedDB persistence, linked folder handle, debounced auto-save, and sync status state. Export: `{ syncStatus, linkFolder, saveData, loadData, exportBackup, importBackup }`
2. Update `App.tsx` — responsive layout: bottom nav on mobile, sidebar on desktop. Wire SyncStatusIcon to syncStatus. Pass storage hook down via context or props.
3. Update `MyQuestions.tsx` VariantModal — add quantity input + chips [3][5][10][20]. Implement batch generate-and-save loop. Apply word-wrap to question text.
4. Update `SprintMode.tsx` QuizCard — remove auto-show solution timeout. Add 'View Solution' toggle visible after any answer (correct or wrong). Double-check anti-spoiler option styling.
5. Update `SmartPaste.tsx` — add 'Add Solution' textarea with Gemini filler stripper utility function. Render mixed fractions in larger math text.
6. Update `Settings.tsx` — add 'Link to Local Folder' button, rename buttons to Export/Import Backup, wire to useStorage hook.
7. Update `index.css` — add mobile layout CSS, touch target sizes, sync icon keyframes, word-wrap styles.
8. Add swipe-to-delete to MyQuestions question cards using touch event handlers.
