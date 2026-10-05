// Офлайн-кеш: после первого визита открытка открывается мгновенно и без интернета.
// __VERSION__ подменяется на хеш коммита при деплое, чтобы старый кеш сбрасывался.
const CACHE = "thx-__VERSION__";
const ASSETS = ["./", "fonts/cormorant-500.woff2", "fonts/cormorant-600.woff2", "fonts/caveat-700.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Страница: сразу из кеша, свежая версия тихо докачивается для следующего раза.
  if (req.mode === "navigate") {
    const fresh = fetch(req)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put("./", res.clone()));
        return res;
      })
      .catch(() => null);
    e.waitUntil(fresh);
    e.respondWith(caches.match("./").then((hit) => hit || fresh.then((r) => r || Response.error())));
    return;
  }

  // Шрифты и картинки: из кеша, если есть.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
    )
  );
});
