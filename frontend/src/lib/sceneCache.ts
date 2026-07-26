import { getAppPathname, withBasePath } from './config'

export function registerSceneCache(): void {
  if (
    !import.meta.env.PROD ||
    getAppPathname() === '/admin' ||
    !('serviceWorker' in navigator)
  ) {
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(
      withBasePath('scene-cache-sw.js'),
      { scope: withBasePath('') },
    )
  }, { once: true })
}
