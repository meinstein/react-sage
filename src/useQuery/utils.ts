/**
 * Promise-ified setTimeout for easier retry logic.
 */
export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

export const hashCode = (code: string): number => {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    const character = code.charCodeAt(i)
    hash = (hash << 5) - hash + character
    // Convert to 32bit integer
    hash = hash & hash
  }
  return hash
}

/**
 * Helper class for dealing with In-memory cache.
 */
interface CacheItem<T> {
  cachedAt: number
  data: T
}

export class Cache {
  cache: {}
  constructor() {
    this.cache = {}
  }

  public upsert<T>(key: string | number, data: T): void {
    if (!key) return
    this.cache[key] = {
      data,
      cachedAt: Date.now()
    } as CacheItem<T>
  }

  public retrieve<T>(key: string | number, ttl?: number): T | null {
    if (!key) return null

    const cachedItem = this.cache[key]

    if (!cachedItem) {
      return null
    }

    // ttl is in seconds - convert to ms
    if (ttl && Date.now() - cachedItem.cachedAt > ttl * 1000) {
      return null
    }

    return cachedItem.data
  }

  public remove(key: string | number): void {
    Reflect.deleteProperty(this.cache, key)
  }

  public reset(): void {
    this.cache = {}
  }
}
