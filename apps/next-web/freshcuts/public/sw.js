// Simple service worker for PWA installation (no offline caching)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated')
  event.waitUntil(self.clients.claim())
})

// No fetch event handler = no offline caching
// App requires internet connection to function