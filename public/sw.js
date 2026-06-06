const CACHE = "proaudit-v1"
const URLS = ["/", "/login", "/dashboard", "/actions", "/audits", "/admin", "/offline"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(URLS))
  )
})

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
