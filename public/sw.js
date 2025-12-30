// Service Worker désactivé - Ne fait rien
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Ne pas intercepter les requêtes fetch
// Laisser le navigateur gérer toutes les requêtes normalement
