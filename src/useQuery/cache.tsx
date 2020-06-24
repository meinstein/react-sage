/**
 * Helper class for dealing with in-memory cache.
 */
interface CacheItem<T> {
  cachedAt: number
  data: T
}

export class Cache {
  cache: { [key: string]: { cachedAt: number; data: any } }

  constructor() {
    this.cache = {}

    this.upsert = this.upsert.bind(this)
    this.retrieve = this.retrieve.bind(this)
    this.createKey = this.createKey.bind(this)
    this.deleteKeyWithExactMatch = this.deleteKeyWithExactMatch.bind(this)
    this.deleteKeysWithPartialMatch = this.deleteKeysWithPartialMatch.bind(this)
  }

  public upsert<T>(key: string | number | null, data: T): void {
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

  public createKey(...parts: Array<string | number>): string {
    if (!parts || !parts.length) return
    return parts.map(String).join('::')
  }

  /**
   * Provide the exact key to delete from the cache.
   */
  public deleteKeyWithExactMatch(key: string | number | null): void {
    if (!key) return
    Reflect.deleteProperty(this.cache, key)
  }

  /**
   * Provide one or many parts of the keys that should be deleted from the cache.
   */
  public deleteKeysWithPartialMatch(...parts: Array<string | number>): void {
    if (!parts || !parts.length) return

    Object.keys(this.cache)
      .filter((cacheKey) => parts.every((part) => cacheKey.includes(String(part))))
      .forEach(this.deleteKeyWithExactMatch)
  }

  public reset(): void {
    this.cache = {}
  }
}

export const cache = new Cache()
