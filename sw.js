'use strict';
const CACHE = 'goobs-survival-app-only-1';
const CORE = [
  './',
  './index.html',
  './field-figures.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './packs/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      const manifest = await (await cache.match('./packs/manifest.json')).json();
      await cache.addAll(manifest.files.map(file => './packs/' + file));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('goobs-survival-') && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function networkWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then(res => {
      clearTimeout(t);
      resolve(res);
    }, err => {
      clearTimeout(t);
      reject(err);
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    networkWithTimeout(req, 4000)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
