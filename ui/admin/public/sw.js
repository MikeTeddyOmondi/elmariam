const staticCacheStorage = "hotel-elmariam-static-v1";
const dynamicCacheStorage = "hotel-elmariam-dynamic-v1";

const staticAssets = [
  "/",
  "/index.html",
  "/offline.html",
  "/favicon.ico",
  "/manifest.json",
  "/css/sb-admin-2.css",
  "/css/sb-admin-2.min.css",
  "/js/sb-admin-2.js",
  "/js/sb-admin-2.min.js",
  "/images/icons/icon-72x72.png",
  "/images/icons/icon-96x96.png",
  "/images/icons/icon-128x128.png",
  "/images/icons/icon-144x144.png",
  "/images/icons/icon-152x152.png",
  "/images/icons/icon-192x192.png",
  "/images/icons/icon-384x384.png",
  "/images/icons/icon-512x512.png",
  "/images/001.png",
  "/images/002.png",
  "/images/003.png",
  "/images/004.png",
  "/images/005.png",
  "/images/006.png",
  "/images/address.png",
  "/images/call.png",
  "/images/close.png",
  "/images/email.png",
  "/images/email2.png",
  "/images/facebook.png",
  "/images/home-img.jpg",
  "/images/instagram.png",
  "/images/menu.png",
  "/images/offline-dino.gif",
  "/images/repostat.png",
  "/images/twitter.png",
  //   "https://fonts.googleapis.com/css2?family=Architects+Daughter&family=PT+Sans&display=swap",
  //   "https://fonts.gstatic.com/s/architectsdaughter/v11/KtkxAKiDZI_td1Lkx62xHZHDtgO_Y-bvTYlg4w.woff2",
];

// Cache Size Limiter
const cacheSizeLimiter = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(cacheSizeLimiter(name, size));
      }
    });
  });
};

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(staticCacheStorage).then((cache) => {
      console.log("Service worker installing and caching resources...");
      return cache.addAll(staticAssets);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(
            (key) => key !== staticCacheStorage && key !== dynamicCacheStorage
          )
          .map((key) => caches.delete())
      );
    })
  );
});

// Fetch resources from cache/network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((fetchedResponse) => {
            return caches.open(dynamicCacheStorage).then((cache) => {
              cache.put(event.request.url, fetchedResponse.clone());
              cacheSizeLimiter(dynamicCacheStorage, 50);
              return fetchedResponse;
            });
          })
        );
      })
      .catch(() => {
        if (event.request.url.indexOf(".html") > -1) {
          event.request.url == "/offline.html";
          return caches.match("/offline.html");
        }
      })
  );
});

// Fetch resources from cache/network
// self.addEventListener("fetch", (event) => {
// 	const request = event.request;
// 	const url = new URL(request.url);
// 	if (url.origin === location.origin) {
// 		event.respondWith(cacheFirst(request));
// 	} else {
// 		event.respondWith(networkFirst(request));
// 	}
// });

// Cache First Strategy
// async function cacheFirst(request) {
// 	const cachedResponse = await caches.match(request);
// 	return cachedResponse || fetch(request);
// }

// Network First Strategy
// async function networkFirst(request) {
// 	const dynamicCache = await caches.open(dynamicCacheStorage);
// 	try {
// 		const networkResponse = await fetch(request);
// 		dynamicCache.put(request, networkResponse.clone());
// 		return networkResponse;
// 	} catch (err) {
// 		const cachedResponse = await dynamicCache.match(request);
// 		return cachedResponse || (await caches.match("./fallback.json"));
// 	}
// }
