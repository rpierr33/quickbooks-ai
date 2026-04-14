const CACHE_KEY = "ledgr-v2";
const OFFLINE_URL = "/offline";
const APP_SHELL = ["/", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_KEY).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_KEY).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Let API calls go straight to network — never cache
  if (url.pathname.startsWith("/api/")) return;

  const isStatic =
    [".js", ".css", ".png", ".svg", ".ico", ".woff2", ".woff", ".ttf"].some(
      (ext) => url.pathname.endsWith(ext)
    ) || url.pathname.startsWith("/_next/static/");

  if (isStatic) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_KEY).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Network-first for navigation / dynamic pages
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_KEY).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});
