/* 파이널 컷 · 서비스 워커
   앱 셸을 캐시해서 오프라인에서도 열리고, 데스크톱/홈화면 설치가 가능하게 함.
   앱을 업데이트하면 CACHE 버전을 올리세요(예: v1 → v2). */
const CACHE = "final-cut-v1";

const ASSETS = [
  ".",
  "index.html",
  "app.js",
  "manifest.webmanifest",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/favicon-64.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // 네비게이션(문서) 요청: 네트워크 우선, 실패 시 캐시된 셸.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("index.html").then((r) => r || caches.match(".")))
    );
    return;
  }

  // 그 외 정적 자원: 캐시 우선, 없으면 네트워크(그리고 캐시에 저장).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
