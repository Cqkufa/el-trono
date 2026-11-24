/* El Trono · service worker
   - Guarda solo la "cáscara" de la app (HTML, íconos, librería, fuentes).
   - Nunca guarda datos de Supabase: rankings, actividad y chat siempre vienen frescos de la red.
   - Sin conexión, la navegación muestra offline.html.
   - Las versiones nuevas esperan hasta que la persona toca "Actualizar". */
const VERSION = 'trono-v3';
const SHELL = ['./', './index.html', './offline.html', './manifest.webmanifest', './vendor/supabase.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('trono-') && k !== VERSION && k !== 'trono-fonts') await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Datos en vivo: nunca desde caché.
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) return;

  // Páginas: red primero (siempre la versión publicada), sin conexión -> pantalla de respaldo.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) { const c = await caches.open(VERSION); c.put('./index.html', res.clone()); }
        return res;
      } catch (_) {
        return (await caches.match('./offline.html')) || Response.error();
      }
    })());
    return;
  }

  // Fuentes de Google: caché con actualización en segundo plano.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith((async () => {
      const c = await caches.open('trono-fonts');
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })());
    return;
  }

  // Archivos propios (íconos, librería, manifest): caché primero.
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { const c = await caches.open(VERSION); c.put(req, res.clone()); }
      return res;
    })());
  }
});
