# Variant — Capacitor/PWA Native Integration

## Current State
- Standard Web Notification API used in `useNotifications.ts` (`Notification.requestPermission`, `new Notification(...)`).
- File save uses `showDirectoryPicker` (File System Access API) in `useStorage.ts`; export uses Blob + anchor download.
- Service worker (`public/sw.js`) is minimal: handles `SHOW_NOTIFICATION` messages and `notificationclick`; no offline caching.
- Settings are persisted to IndexedDB and `localStorage` only. No Capacitor Preferences.
- No `manifest.json` for PWA.
- No Permission Manager screen.
- No Capacitor packages installed.

## Requested Changes (Diff)

### Add
- `manifest.json` in `public/` — full PWA manifest (name, icons, theme color, display: standalone).
- Workbox-powered service worker in `public/sw.js` — cache-first strategy for all JS/CSS/HTML/images; runtime caching for API calls; `self.registration.showNotification` for background notifications.
- New view `PermissionManager.tsx` — startup modal/screen that calls `requestPermissions()` for Notifications and Storage on first open; persists status via Capacitor Preferences (falls back to localStorage on web).
- `useCapacitorPreferences.ts` hook — wraps Capacitor `Preferences` API with graceful web fallback to `localStorage`.
- `useCapacitorNotifications.ts` hook — wraps `@capacitor/local-notifications` with web-SW fallback.
- `useCapacitorStorage.ts` hook — replaces `showSaveFilePicker` with Capacitor Filesystem write + Blob download fallback.
- Capacitor packages to `package.json`: `@capacitor/core`, `@capacitor/local-notifications`, `@capacitor/filesystem`, `@capacitor/preferences`.
- `<link rel="manifest">` and theme-color meta tags added to `index.html`.
- Navigation item `"permissions"` visible in Settings area (or as modal on startup).

### Modify
- `public/sw.js` — replace minimal SW with Workbox precache + runtime cache strategies + notification handler.
- `useNotifications.ts` — delegate to `useCapacitorNotifications` for permission request and `LocalNotifications.schedule()`; keep SW fallback.
- `useStorage.ts` — replace `showDirectoryPicker` / `FileSystemAccessAPI` with Capacitor Filesystem + Android Blob-download approach; use `useCapacitorPreferences` for master folder path persistence.
- `Settings.tsx` — add link/button to open Permission Manager; update storage section to explain Android download approach.
- `App.tsx` — show Permission Manager screen on first launch (when permissions not yet granted); add `"permissions"` to nav or modal trigger.
- `index.html` — add PWA meta tags and manifest link.

### Remove
- Direct calls to `window.showDirectoryPicker` (non-Android compatible).
- Direct `new Notification(...)` calls (replace with Capacitor local-notifications + SW).

## Implementation Plan
1. Install Capacitor peer dependencies (`@capacitor/core`, `@capacitor/local-notifications`, `@capacitor/filesystem`, `@capacitor/preferences`) in `package.json`.
2. Create `useCapacitorPreferences.ts` — thin wrapper around Capacitor Preferences with localStorage fallback.
3. Create `useCapacitorNotifications.ts` — wraps LocalNotifications; falls back to SW postMessage on web.
4. Create `useCapacitorStorage.ts` — Filesystem.writeFile for native, Blob anchor download for web/Android PWA.
5. Rewrite `public/sw.js` with Workbox-style cache-first for static assets, SW notification handler.
6. Add `public/manifest.json`.
7. Create `PermissionManager.tsx` view — requests both Notifications + Storage permissions, stores result in Preferences.
8. Update `useNotifications.ts` to use `useCapacitorNotifications`.
9. Update `useStorage.ts` to use `useCapacitorStorage` and Preferences for folder path.
10. Update `Settings.tsx` — update UI copy for Android download approach; add Permission Manager link.
11. Update `App.tsx` — integrate PermissionManager startup modal.
12. Update `index.html` — PWA meta tags + manifest link.
