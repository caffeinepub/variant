// Service worker: Workbox-style offline caching + timer notifications
const CACHE_NAME = "variant-v6";
const STATIC_ASSETS = ["/", "/index.html"];

// Install: cache static shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  e.waitUntil(self.clients.claim());
});

// Fetch: stale-while-revalidate for navigations, cache-first for assets
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin
  if (
    e.request.method !== "GET" ||
    !url.origin.includes(self.location.origin.split("//")[1])
  )
    return;

  // Navigation: network-first, fallback to /index.html
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Assets (.js, .css, .png, .jpg, .svg, .woff2, .ico, .json): cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|svg|woff2?|ico|json)$/)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      }),
    );
    return;
  }
});

// Timer notification via postMessage
self.addEventListener("message", (e) => {
  if (e.data?.type === "SHOW_NOTIFICATION") {
    const { title, body } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: "/assets/generated/variant-logo-transparent.dim_200x200.png",
      badge: "/assets/generated/variant-logo-transparent.dim_200x200.png",
      vibrate: [200, 100, 200],
      tag: "timer-done",
      requireInteraction: false,
    });
  }
});
