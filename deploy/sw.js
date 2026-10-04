// 选衣录 PWA - Service Worker
const CACHE_NAME = 'xuanyilu-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安装：缓存核心文件
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// 拦截请求：缓存优先，网络回退
self.addEventListener('fetch', function (event) {
  const req = event.request;
  
  // 只缓存 GET 请求
  if (req.method !== 'GET') return;
  
  event.respondWith(
    caches.match(req).then(function (cached) {
      // 缓存命中直接返回
      if (cached) return cached;
      
      // 没命中就去网络请求，同时缓存新内容
      return fetch(req).then(function (response) {
        // 只缓存同源的成功响应
        if (response && response.status === 200 && 
            new URL(req.url).origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, clone);
          });
        }
        return response;
      }).catch(function () {
        // 离线且无缓存时，返回首页
        return caches.match('./index.html');
      });
    })
  );
});
