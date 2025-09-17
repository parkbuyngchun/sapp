// Service Worker for 사랑이 스케줄 PWA
const CACHE_NAME = 'sapp-v1.0.0';
const STATIC_CACHE = 'sapp-static-v1.0.0';
const DYNAMIC_CACHE = 'sapp-dynamic-v1.0.0';

// 캐시할 정적 리소스들
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  // 오프라인 폰트
  '/fonts/noto-sans-kr-300.woff2',
  '/fonts/noto-sans-kr-400.woff2',
  '/fonts/noto-sans-kr-500.woff2',
  '/fonts/noto-sans-kr-600.woff2',
  '/fonts/noto-sans-kr-700.woff2',
  // 오프라인 아이콘
  '/icons/font-awesome.woff2',
  '/icons/font-awesome.woff',
  '/icons/font-awesome.ttf'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('정적 리소스 캐싱 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker 설치 완료');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker 설치 실패:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker 활성화 완료');
        return self.clients.claim();
      })
  );
});

// fetch 이벤트 (네트워크 요청 가로채기)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return;
  }

  // 정적 리소스 처리
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                });
              return fetchResponse;
            });
        })
    );
    return;
  }

  // 동적 리소스 처리 (Cache First 전략)
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then(fetchResponse => {
            // 성공적인 응답만 캐시
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            return fetchResponse;
          })
          .catch(error => {
            console.log('네트워크 오류, 오프라인 모드:', error);
            
            // 오프라인 페이지 반환
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // 기본 오프라인 응답
            return new Response('오프라인 모드입니다.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('백그라운드 동기화 실행');
    // 여기에 오프라인에서 저장된 데이터를 동기화하는 로직 추가 가능
  }
});

// 푸시 알림 (선택사항)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
