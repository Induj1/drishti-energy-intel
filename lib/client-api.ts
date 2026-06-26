function apiBase() {
  return process.env.NEXT_PUBLIC_DRISHTI_API_BASE?.replace(/\/+$/, '') ?? ''
}

export function apiUrl(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const base = apiBase()
  return base ? `${base}${cleanPath}` : cleanPath
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init)
}
