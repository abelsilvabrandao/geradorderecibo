self.addEventListener("install", event => {
    event.waitUntil(
      caches.open("recibo-cache").then(cache =>
        cache.addAll([
          "./",
          "./index.html",
          "./manifest.json",
          "./icon-192.png",
          "./icon-512.png",
          "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
        ])
      )
    );
  });
  
  self.addEventListener("fetch", event => {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  });
  