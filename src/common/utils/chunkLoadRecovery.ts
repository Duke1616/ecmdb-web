const RELOAD_FLAG_KEY = "ecmdb:chunk-load-reload-at"
const RELOAD_INTERVAL = 10_000

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk .* failed/i
]

export function isChunkLoadError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : ""

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

export function reloadOnChunkLoadError() {
  const lastReloadAt = Number(sessionStorage.getItem(RELOAD_FLAG_KEY) || 0)
  const now = Date.now()

  if (now - lastReloadAt < RELOAD_INTERVAL) {
    return false
  }

  sessionStorage.setItem(RELOAD_FLAG_KEY, String(now))
  window.location.reload()
  return true
}

export function clearChunkLoadReloadFlag() {
  sessionStorage.removeItem(RELOAD_FLAG_KEY)
}
