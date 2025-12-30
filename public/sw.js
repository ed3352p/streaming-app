// Service Worker minimal pour Lumixar
const CACHE_NAME = 'lumixar-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Laisser passer toutes les requêtes sans cache et gérer les erreurs silencieusement
  event.respondWith(
    fetch(event.request).catch(() => {
      // Retourner une réponse vide en cas d'erreur pour éviter les logs d'erreur
      return new Response('', { status: 200, statusText: 'OK' });
    })
  );
});
