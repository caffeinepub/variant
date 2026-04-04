# Variant — PWA Evolution (Version 6)

## Current State
- SprintMode: flat question picker list → generates horizontal card scroll
- Generate Preview: shown as an inline section within a modal/card
- QuizCard: compact horizontal scroll card (300-340px), answer status shown after click
- Storage: IndexedDB Layer 1, Capacitor Filesystem Layer 2 (linked via Preferences)
- Sprint: flat list of questions with subject/chapter chips
- PWA manifest: already has `display: standalone`, theme color set
- index.html: has viewport meta but no `viewport-fit=cover`
- No folder-based directory for offline files; linkFolder() just sets a Preferences flag
- No nested topic hierarchy in Sprint
- No File System Access API integration; idb-keyval not installed

## Requested Changes (Diff)

### Add
1. **FullScreenQuizView** — a new full-screen overlay component (`position:fixed, inset:0, 100vh`) that renders a single question at a time. Triggered on scroll OR click from any question card. Contains: full question text (no truncation), 4 MCQ options (answer/status hidden until option tapped), correct/incorrect reveal only after click with neon-cyan/red glow, View Solution toggle, navigation arrows (prev/next card).
2. **useOfflineDirectory hook** — implements File System Access API (`window.showDirectoryPicker()`). Persists the FileSystemDirectoryHandle in IndexedDB via `idb-keyval`. On boot, tries to re-read the handle from idb-keyval and verify permissions with `handle.queryPermission()`. Exposes `dirHandle`, `dirName`, `pickDirectory()`, `isConnected` state.
3. **Set Offline Directory button** — in Settings view, below existing storage section. Uses `useOfflineDirectory` hook. Shows status: connected directory name or "Not connected". When connected, auto-writes JSON backup on save events.
4. **SprintHierarchy** — rebuild Sprint question picker as a 3-level nested folder tree:
   - Level 1: Topic (collapsible folder row with chevron)
   - Level 2: Sub-type (nested collapsible subfolder, indented)
   - Level 3: Question list (clickable rows that open FullScreenQuizView)
   - Derived from questions `topic` → `type` → questions grouping
5. **Optimistic cloud sync layer** (`useCloudSync` hook) — on save/create:
   1. Write to IndexedDB immediately (already done)
   2. In background, call actor (ICP backend) to persist — treated as "cloud"
   3. Sync status dot reflects: idle → syncing (yellow pulse) → synced (green) → error (red)
   4. Retry queue for failed syncs stored in IndexedDB
6. **PWA manifest update** — add `viewport-fit=cover` to `<meta name="viewport">` in index.html

### Modify
1. **index.html** — add `viewport-fit=cover` to existing viewport meta tag
2. **SprintMode.tsx** — replace flat question picker with SprintHierarchy nested folder tree; clicking a question opens FullScreenQuizView instead of inline card carousel
3. **QuizCard / VariantModal in MyQuestions.tsx** — "Generate Preview" button triggers FullScreenQuizView for the generated card instead of inline display
4. **useStorage.ts** — integrate with useOfflineDirectory: when dirHandle is connected, write JSON to the picked folder using FileSystemWritableFileStream instead of Blob download
5. **Settings.tsx** — add "Set Offline Directory" button section
6. **sw.js** — bump cache name to `variant-v6`

### Remove
- Nothing removed, only extended

## Implementation Plan

1. Install `idb-keyval` package in frontend/package.json dependencies.
2. Create `src/frontend/src/hooks/useOfflineDirectory.ts` — File System Access API hook with idb-keyval persistence.
3. Create `src/frontend/src/components/FullScreenQuizView.tsx` — full-screen question overlay with MCQ, answer reveal, prev/next navigation, close button.
4. Modify `src/frontend/src/views/SprintMode.tsx` — replace flat picker with nested Topic→Subtype→Question folder tree; open FullScreenQuizView on question click.
5. Modify `src/frontend/src/views/MyQuestions.tsx` — "Generate Preview" / "Generate Variant" button opens FullScreenQuizView after generation.
6. Modify `src/frontend/src/views/Settings.tsx` — add Offline Directory section with Set Directory button and status display.
7. Modify `src/frontend/src/hooks/useStorage.ts` — integrate offline directory write when dirHandle available.
8. Modify `src/frontend/index.html` — add `viewport-fit=cover` to viewport meta.
9. Modify `src/frontend/public/manifest.json` — confirm `display: standalone` (already set), add `id` field for installability.
10. Modify `src/frontend/public/sw.js` — bump cache version to `variant-v6`.
