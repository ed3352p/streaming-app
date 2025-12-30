// Service Worker minimal pour Lumixar
const CACHE_NAME = 'lumixar-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Laisser passer toutes les requêtes sans cache pour l'instant
  event.respondWith(fetch(event.request));
});
