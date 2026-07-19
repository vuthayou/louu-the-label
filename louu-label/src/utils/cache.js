const CACHE_VERSION = 'v1'

function storageKey(key) {
  return `louu-cache-${CACHE_VERSION}-${key}`
}

// Reads a cached JSON value for `key`, if any — used to render a repeat
// visit's last-known content instantly, before the fresh fetch (always
// triggered alongside this, see writeCache) resolves.
export function readCache(key) {
  try {
    const raw = localStorage.getItem(storageKey(key))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Saves a JSON-serializable value for `key`. Silently does nothing if
// storage is unavailable (private browsing, quota, disabled) — caching is
// a nice-to-have speed boost, never something that should break the page.
export function writeCache(key, value) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value))
  } catch {
    // ignore — best-effort only
  }
}
