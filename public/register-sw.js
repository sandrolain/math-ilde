// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('ngsw-worker.js')
    .catch((err) => console.log('Service Worker registration failed: ', err));
}
