// オフライン用キャッシュ。index.html を更新したら VERSION を上げる。
const VERSION = 'otsuka-manga-v16';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Yomogi&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
async function cacheFonts(c) {
  if (!FONT_CSS) return;
  try {
    const res = await fetch(FONT_CSS, {mode: 'cors'});
    if (!res.ok) return;
    const css = await res.clone().text();
    await c.put(FONT_CSS, res);
    const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]);
    await Promise.all(urls.map(u => fetch(u, {mode: 'cors'}).then(r => r.ok && c.put(u, r)).catch(() => {})));
  } catch (e) {}
}
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES).then(() => cacheFonts(c))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: sameOrigin, ignoreVary: true}).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res;
    }).catch(() => sameOrigin ? caches.match('./index.html') : Response.error()))
  );
});
