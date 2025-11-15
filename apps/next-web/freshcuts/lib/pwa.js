// PWA service worker registration
export const registerSW = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('PWA: Service Worker registered'))
      .catch(() => console.log('PWA: Service Worker registration failed'))
  }
}