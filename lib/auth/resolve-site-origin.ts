/**
 * Origem pública do site para redirects pós-login (OAuth callback).
 * Evita usar `new URL(request.url).origin` quando o Node recebe URL interna
 * (proxy/load balancer) — isso gera redirects inválidos e a página de erro do Chrome.
 */
export function resolveSiteOrigin(request: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }

  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host') || requestUrl.host

  if (!host) {
    return requestUrl.origin
  }

  let protocol =
    forwardedProto ||
    (requestUrl.protocol === 'https:' ? 'https' : 'http')

  if (
    process.env.NODE_ENV === 'production' &&
    protocol === 'http' &&
    !host.includes('localhost') &&
    !host.startsWith('127.')
  ) {
    protocol = 'https'
  }

  return `${protocol}://${host}`
}

/** Apenas caminhos relativos seguros; evita open redirect e URLs absolutas em `next`. */
export function sanitizeOAuthNextParam(nextParam: string | null): string {
  const fallback = '/dashboard'
  if (!nextParam) return fallback

  let value = nextParam.trim()
  try {
    value = decodeURIComponent(value)
  } catch {
    return fallback
  }

  value = value.trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('..')) {
    return fallback
  }

  return value || fallback
}
