/**
 * 
 * Melisa Mercado Vargas 7CM1
 * Práctica 7
 * Sistemas Distribuidos
 */

const CACHE_NAME = 'simple-pwa-cache-v1';
// url a cachear
const urlsToCache = ['.']; 

// instalación del sw
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache abierto.');
                //agrega la url a cache
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                 console.log('Service Worker: Recursos cacheados exitosamente.');
                 return self.skipWaiting();
            })
    );
});

// activacion del sw. pide al navegador los cahces y borra los que no coinciden con el nombre actual
//ayuda con el control de versiones y actualizaciones
self.addEventListener('activate', event => {
    console.log('Service Worker: Activado.');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Borrando caché antigua', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

//fetch para las peticiones de red
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  //revisa si es petición a la api
  const isApiRequest = url.hostname === 'api.quotable.io' || url.hostname === 'jsonplaceholder.typicode.com';

  if (isApiRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        //intenta obtener la respuesta de la red
        return fetch(event.request).then(networkResponse => {
          //guarda una copia en caché
          console.log(`Service Worker: Guardando en caché la respuesta de ${url.hostname}`);
          //clona la respuesta para mandarla a la pagina
          //solo se puede usar una vez la respuesta
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          //busca caché si no hay red
          console.log(`Service Worker: Sirviendo desde caché la respuesta de ${url.hostname}`);
          return cache.match(event.request);
        });
      })
    );
    return;
  }
  //al cargar la página, busca en caché primero
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});