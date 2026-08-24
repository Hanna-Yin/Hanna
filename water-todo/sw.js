// v8：新增待办类型「工作日（含调休，内置 holiday.json 节假日数据）」与「自定义（多选日期）」
const CACHE = 'water-todo-v8';
const ASSETS = ['./index.html', './icon.svg', './icons/icon-192.png', './icons/icon-512.png', './holiday.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // 本地 API（/api/...）不缓存，始终走网络，保证待办/配置数据实时
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
