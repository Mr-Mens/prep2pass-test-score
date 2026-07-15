/* Pass Pilot service worker — cache shell assets and provide offline fallback. */

const IS_DEV =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname.endsWith(".local");

const CACHE_VERSION = IS_DEV ? "pass-pilot-pwa-dev" : "pass-pilot-pwa-v6";

const PRECACHE_URLS = IS_DEV
  ? ["/offline.html", "/manifest.webmanifest"]
  : [
      "/?source=pwa",
      "/",
      "/offline.html",
      "/manifest.webmanifest",
      "/brand/pass-pilot-favicon-32.png",
      "/brand/pass-pilot-icon-192.png",
      "/brand/pass-pilot-icon-192-maskable.png",
      "/brand/pass-pilot-icon-512.png",
      "/brand/pass-pilot-icon-512-maskable.png",
      "/brand/pass-pilot-icon-180.png",
    ];

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/social-banner/") ||
    pathname.endsWith(".woff2")
  );
}

function isBypassRequest(url, request) {
  if (request.method !== "GET") return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/auth/")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || isBypassRequest(url, request)) {
    return;
  }

  if (request.mode === "navigate") {
    if (IS_DEV) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match("/offline.html");
          if (offline) return offline;
          return new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }),
    );
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (IS_DEV) {
          return fetch(request).catch(() => cached);
        }

        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Pass Pilot",
    body: "You have a new update.",
    url: "/dashboard",
    badgeCount: 1,
    tag: "pass-pilot-notification",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // Keep defaults.
  }

  const badgeCount = typeof data.badgeCount === "number" ? data.badgeCount : 1;

  event.waitUntil(
    (async () => {
      try {
        if (badgeCount > 0 && self.registration.setAppBadge) {
          await self.registration.setAppBadge(badgeCount);
        } else if (badgeCount <= 0 && self.registration.clearAppBadge) {
          await self.registration.clearAppBadge();
        }
      } catch {
        // Badge API unavailable.
      }

      await self.registration.showNotification(data.title || "Pass Pilot", {
        body: data.body || "You have a new update.",
        icon: "/brand/pass-pilot-icon-192.png",
        badge: "/brand/pass-pilot-favicon-32.png",
        tag: data.tag || "pass-pilot-notification",
        renotify: true,
        data: { url: data.url || "/dashboard" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(absoluteUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl);
      }
    })(),
  );
});
