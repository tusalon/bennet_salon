// sw.js - Service Worker para BennetSalón

const CACHE_NAME = 'bennetsalon-v1';
const urlsToCache = [
  '/bennet_salon/',
  '/bennet_salon/index.html',
  '/bennet_salon/admin.html',
  '/bennet_salon/admin-login.html',
  '/bennet_salon/setup-wizard.html',
  '/bennet_salon/editar-negocio.html',
  '/bennet_salon/manifest.json',
  '/bennet_salon/icons/icon-72x72.png',
  '/bennet_salon/icons/icon-96x96.png',
  '/bennet_salon/icons/icon-128x128.png',
  '/bennet_salon/icons/icon-144x144.png',
  '/bennet_salon/icons/icon-152x152.png',
  '/bennet_salon/icons/icon-192x192.png',
  '/bennet_salon/icons/icon-384x384.png',
  '/bennet_salon/icons/icon-512x512.png'
];

// ============================================
// INSTALACIÓN
// ============================================
self.addEventListener('install', event => {
  console.log('📦 Service Worker instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache creado, guardando archivos...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ Error al cachear archivos:', error);
      })
  );
});

// ============================================
// ACTIVACIÓN
// ============================================
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activado, limpiando caches antiguos...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado y listo');
      return self.clients.claim();
    })
  );
});

// ============================================
// ESTRATEGIA DE CACHÉ
// ============================================
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  
  if (event.request.url.includes('wa.me') || 
      event.request.url.includes('api.whatsapp.com') ||
      event.request.url.includes('whatsapp.com')) {
    console.log('📱 Dejando pasar WhatsApp sin cache');
    return;
  }
  
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('ntfy.sh')) return;
  if (event.request.url.includes('unsplash.com')) return;
  if (event.request.url.includes('cdn.') || 
      event.request.url.includes('unpkg.com') || 
      event.request.url.includes('trickle.so')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('📦 Sirviendo desde cache:', event.request.url);
            return cachedResponse;
          }
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
            return caches.match('/bennet_salon/icons/icon-192x192.png');
          }
          return new Response('Error de red', { status: 408 });
        });
      })
  );
});

// ============================================
// MANEJO DE MENSAJES
// ============================================
self.addEventListener('message', event => {
  console.log('📨 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Saltando waiting...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🧹 Limpiando todo el cache...');
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('🗑️ Cache eliminado:', cacheName);
      });
    });
  }
});

console.log('✅ Service Worker configurado para BennetSalón');
console.log('📦 Cache:', CACHE_NAME);
console.log('📄 Archivos a cachear:', urlsToCache.length);