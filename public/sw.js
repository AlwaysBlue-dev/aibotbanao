const CACHE_NAME = 'aibotbanao-v1';

const PRECACHE_URLS = [
  '/',
  '/setup',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
});

// ── Message ───────────────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // API routes — network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Navigation requests — network first, fallback to cache then /offline
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Static assets — cache first, update in background
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
});

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    console.log('[SW] Navigation network hit:', request.url);
    return networkResponse;
  } catch {
    console.log('[SW] Navigation network fail, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Navigation cache hit:', request.url);
      return cached;
    }
    console.log('[SW] Navigation cache miss, serving /offline');
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    console.log('[SW] API network hit:', request.url);
    return response;
  } catch {
    console.log('[SW] API network fail (offline):', request.url);
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'No internet connection. Please check your connection and try again.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    console.log('[SW] Static cache hit:', request.url);
    // Update cache in background
    updateCacheInBackground(request);
    return cached;
  }

  console.log('[SW] Static cache miss, fetching:', request.url);
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    console.warn('[SW] Static fetch failed:', request.url, err);
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
      }
    })
    .catch(() => {
      // Background update failed — cached version is still being served, no action needed
    });
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|otf)$/i.test(url.pathname);
}
