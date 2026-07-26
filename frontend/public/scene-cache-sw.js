const CACHE_PREFIX = 'astro-base-scene-'
const CACHE_NAME = `${CACHE_PREFIX}v4`
const FULL_RESOLUTION_TEXTURE_FILES = [
  'textures/2k_earth_clouds.jpg',
  'textures/2k_earth_daymap.jpg',
  'textures/2k_earth_normal_map.png',
  'textures/2k_earth_specular_map.jpg',
  'textures/2k_jupiter.jpg',
  'textures/2k_mars.jpg',
  'textures/2k_mercury.jpg',
  'textures/2k_neptune.jpg',
  'textures/2k_saturn.jpg',
  'textures/2k_saturn_ring_alpha.png',
  'textures/2k_sun.jpg',
  'textures/2k_uranus.jpg',
  'textures/2k_venus_atmosphere.jpg',
  'textures/8k_stars_milky_way.jpg',
]
const PREVIEW_TEXTURE_FILES = FULL_RESOLUTION_TEXTURE_FILES
  .filter((path) => !path.includes('stars_milky_way'))
  .map((path) => path.replace('textures/', 'textures/preview/'))
const TEXTURE_FILES = [
  ...PREVIEW_TEXTURE_FILES,
  ...FULL_RESOLUTION_TEXTURE_FILES,
]

const textureUrls = TEXTURE_FILES.map(
  (path) => new URL(path, self.registration.scope).href,
)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(textureUrls))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin || !url.pathname.includes('/textures/')) {
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true })
      const refreshed = fetch(request)
        .then((response) => {
          if (response.ok) {
            void cache.put(request, response.clone())
          }

          return response
        })
        .catch(() => cached ?? Response.error())

      return cached ?? refreshed
    }),
  )
})
