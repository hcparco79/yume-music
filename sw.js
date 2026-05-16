// YUME Service Worker v1.0
const CACHE_NAME = 'yume-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&display=swap',
];

// 설치: 정적 파일 캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 가로채기: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', (e) => {
  // YouTube API, 외부 리소스는 캐시하지 않음
  const url = new URL(e.request.url);
  if (
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('ytimg.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('lrclib.net') ||
    url.hostname.includes('genius.com') ||
    url.hostname.includes('allorigins.win')
  ) {
    return; // 네트워크 직접 사용
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        // 성공적인 GET 요청만 캐시
        if (!response || response.status !== 200 || e.request.method !== 'GET') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cloned));
        return response;
      }).catch(() => {
        // 오프라인 폴백
        return caches.match('/index.html');
      });
    })
  );
});

// 백그라운드 동기화 (향후 확장용)
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
