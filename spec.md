# Variant — Timer Notification System

## Current State
The app has Settings, SmartPaste, MyQuestions, and SprintMode views. There is no notification permission logic, no service worker registration, and no bell icon indicator. The SyncStatusIcon sits in the header but there is no notification status.

## Requested Changes (Diff)

### Add
- `public/sw.js` — service worker that listens for `SHOW_NOTIFICATION` messages and calls `self.registration.showNotification()` with vibrate/tag/sound options
- `src/hooks/useNotifications.ts` — hook managing notification permission state, SW registration, test countdown, and helper to fire a notification via the SW
- `src/components/NotificationBell.tsx` — bell icon with three visual states: grey (default), red-slash (denied), glowing green (granted+verified)
- Notification section in Settings: "Enable Timer Notifications" button, "Test Notification" button (5-second countdown then fires notification), permission modal for wrapper/manual instructions

### Modify
- `App.tsx` — import and register SW on mount, import `useNotifications` hook, pass notification helpers to Settings, show `NotificationBell` in header next to `SyncStatusIcon`
- `Settings.tsx` — accept `notifications` prop from `useNotifications`, render the new Notifications card

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/public/sw.js` — registers a `message` event listener; on `{type:'SHOW_NOTIFICATION'}` fires `showNotification` with title, body, vibrate:[200,100,200], tag:'timer-done'
2. Create `src/frontend/src/hooks/useNotifications.ts` — tracks `permission` state (default/granted/denied), `verified` boolean, `testCountdown` number; exposes `requestPermission()`, `testNotification()`, `fireNotification(title, body)`, handles SW registration with `navigator.serviceWorker.register('/sw.js')`
3. Create `src/frontend/src/components/NotificationBell.tsx` — renders Bell icon from lucide-react in grey/red-with-BellOff/green-glowing based on permission+verified
4. Update `Settings.tsx` — add Notifications card with "Enable Timer Notifications" button, "Test Notification" button with live countdown display, and permission-denied modal with manual instructions
5. Update `App.tsx` — call `useNotifications`, pass to Settings, add `NotificationBell` in header
