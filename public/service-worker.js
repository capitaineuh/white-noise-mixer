// Service Worker minimal: no-op pour éviter toute interception réseau
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
