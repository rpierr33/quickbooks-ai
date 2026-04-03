const CACHE_KEY = "ledgr-v1";
const APP_SHELL = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_KEY).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_KEY).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isStatic = [".js",".css",".png",".svg",".ico",".woff2"].some((e) => url.pathname.endsWith(e));
  if (isStatic || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((c) => c || fetch(request).then((r) => {
        if (r.ok) { const cl = r.clone(); caches.open(CACHE_KEY).then((ca) => ca.put(request, cl)); }
        return r;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(request).then((r) => {
      if (r.ok) { const cl = r.clone(); caches.open(CACHE_KEY).then((ca) => ca.put(request, cl)); }
      return r;
    }).catch(() => caches.match(request).then((c) => c || caches.match("/")))
  );
});
