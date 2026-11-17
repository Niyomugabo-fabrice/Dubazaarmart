const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}

export function mediaUrl(path: string | undefined): string {
  if (!path) {
    return ""
  }

  if (path.startsWith("/uploads/")) {
    return apiUrl(path)
  }

  return path
}
