export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export function withBasePath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function getAppPathname(): string {
  const pathname = window.location.pathname
  const basePath = import.meta.env.BASE_URL === '/'
    ? ''
    : import.meta.env.BASE_URL.replace(/\/$/, '')

  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    const appPathname = pathname.slice(basePath.length) || '/'
    return appPathname.length > 1 ? appPathname.replace(/\/+$/, '') : appPathname
  }

  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}
