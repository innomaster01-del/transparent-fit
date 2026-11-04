// Change VERSION whenever the model or engine files change. The page itself
// does not need a bump: it is fetched network-first, so every release reaches
// phones on their next open. (The previous worker served everything
// cache-first under a name that never changed, so an installed phone never
// saw an update again.)
const VERSION = "tf-v13";

const FILES = [
  "./", "index.html", "manifest.webmanifest",
  "vision_bundle.mjs", "vision_wasm_internal.js", "vision_wasm_internal.wasm",
  "models/seg-1.wasm", "models/seg-2.wasm", "models/pose.wasm",
  "parser-worker.js", "garment-worker.js", "vendor/ort/ort.wasm.min.js", "vendor/ort/ort-wasm-simd-threaded.wasm", "vendor/ort/ort-wasm-simd-threaded.mjs",
  "models/garment-1.wasm", "models/garment-2.wasm", "models/garment-3.wasm", "models/garment-4.wasm",
  "models/magictouch-1.wasm", "models/magictouch-2.wasm", "models/magictouch-3.wasm", "models/parser.json", "models/parser-1.wasm", "models/parser-2.wasm", "models/kern.wasm",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // The app page: newest from the network, the cached copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("index.html", copy)); }
          return res;
        })
        .catch(() => caches.match("index.html")),
    );
    return;
  }

  // Engine and models (about 30 MB): from the cache, so the app opens instantly
  // and works with no signal.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
