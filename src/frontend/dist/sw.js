// Service worker for timer notifications
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Timer Done!', {
        body: body || 'Your timer has ended.',
        icon: '/assets/generated/variant-logo-transparent.dim_200x200.png',
        badge: '/assets/generated/variant-logo-transparent.dim_200x200.png',
        vibrate: [200, 100, 200],
        tag: 'timer-done',
        requireInteraction: false,
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
