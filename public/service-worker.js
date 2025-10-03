// Service Worker pour la lecture audio en arrière-plan
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Gérer les messages du client pour la lecture audio en arrière-plan
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Garder le service worker actif pour la lecture audio
self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les requêtes audio pour permettre la lecture en arrière-plan
  if (event.request.url.includes(".mp3") || event.request.url.includes(".m4a") || event.request.url.includes(".wav")) {
    return;
  }
});
