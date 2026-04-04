# Variant

## Current State
- App has `useInternetIdentity` hook and `InternetIdentityProvider` wrapping the app, but NO login UI is exposed to the user.
- `useActor` creates an anonymous actor when no identity is set — anonymous calls to the ICP backend canister fail with authorization errors, causing "Failed to save question".
- After save in SmartPaste, `onSavedAndSprint()` switches to sprint tab, which causes the scroll-to-top behavior but the user perceives it as unwanted auto-scroll.
- The backend IS the cloud storage (ICP canister), but without login, data isn't persisted per-user and calls fail.
- Offline file save options exist in Settings (Export Backup / Enable File Saving).

## Requested Changes (Diff)

### Add
- Internet Identity login button in the header (mobile) and sidebar footer (desktop) — shows avatar/principal when logged in, login button when not.
- A cloud sync status indicator showing whether data is stored on the ICP canister (logged in) or local-only (anonymous).
- After login, immediately re-fetch questions and sync local data to canister.
- In Settings, add an "ICP Cloud Sync" section with login/logout and a "Sync to Cloud" / "Download from Cloud" button pair.
- Small login prompt banner in SmartPaste when actor is anonymous (so user knows why save fails).

### Modify
- Fix "Failed to save question": The backend `createMasterQuestion` requires an authenticated call. When actor is anonymous, show a toast directing user to log in instead of showing generic error.
- Fix auto-scroll: After save & sprint transition, prevent the scroll-to-top by using `scrollIntoView` on the current position OR ensure the sprint tab view keeps scroll position at top (which is correct behavior — the issue is the scroll is jarring). Add `behavior: 'instant'` scroll reset to top when switching tabs so it doesn't scroll down to content mid-page.
- Update Settings to add ICP cloud login/logout with export-to-canister and import-from-canister flows.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `LoginButton` component — uses `useInternetIdentity` to show login/logout state with principal truncation, Internet Identity popup trigger.
2. Add `LoginButton` to App.tsx header (mobile) and sidebar footer (desktop).
3. In SmartPaste.tsx — wrap the save button section with a check: if `!identity` (anonymous), show a "Login required" inline notice with a login trigger instead of attempting the save.
4. Fix tab switching scroll: In App.tsx, when `setView` is called, reset the scroll container to top (`scrollRef.current.scrollTop = 0`) so switching tabs always goes to the top of the new view.
5. Add ICP cloud sync section to Settings.tsx — login status, "Sync to Cloud" (exports all local questions to canister), "Load from Cloud" (loads canister data into local state).
6. Ensure `useActor` hook reflects logged-in state so all backend calls use authenticated identity.
