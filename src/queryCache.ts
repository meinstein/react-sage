/**
 * Helper class for dealing with in-memory cache.
 */

export namespace QueryCache {
  export type Status = 'PENDING' | 'DONE' | 'FAILED'
  export type Mode = 'ONLINE' | 'OFFLINE'

  export interface Item<T> {
    cachedAt: number
    data: T | Error
    status: Status
  }
}

export class Cache {
  /**
   * A default TTL for retrievals that do not specify one.
   */
  ttl: number
  /**
   * The maximum number of keys to be stored in the cache.
   */
  maxSize: number
  /**
   * Either online or offline.
   * When offline, TTLs are ignored and cache is always shown.
   */
  mode: QueryCache.Mode
  /**
   * An ordered list of cache keys (oldest to newest)
   */
  order: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: Record<string, QueryCache.Item<any>>

  constructor() {
    this.cache = {}
    this.order = []

    this.ttl = 0
    this.maxSize = 1000
    this.mode = 'ONLINE'

    this.configure = this.configure.bind(this)
    this.upsert = this.upsert.bind(this)
    this.retrieve = this.retrieve.bind(this)
    this.createKey = this.createKey.bind(this)
    this.deleteKeyWithExactMatch = this.deleteKeyWithExactMatch.bind(this)
    this.deleteKeysWithPartialMatch = this.deleteKeysWithPartialMatch.bind(this)
  }

  /**
   * This TTL (in seconds) is used for all cache retrievals that do not specify a TTL.
   * If a TTL is included in a given cache.retrieve(key, ttl), it will override this setting.
   */
  public configure(configs: { ttl?: number; maxSize?: number }): void {
    if (configs.ttl) {
      this.ttl = configs.ttl
    }
    if (configs.maxSize) {
      this.maxSize = configs.maxSize
    }
  }

  public upsert<T>(key: string | null, data: T, status: QueryCache.Status): void {
    if (key) {
      // Check total number of keys in cache
      const cacheSize = Object.keys(this.cache).length
      if (cacheSize > this.maxSize) {
        // When exceeds max size, shift (ie, remove the oldest key) and delete from cache.
        this.deleteKeyWithExactMatch(this.order.shift())
      }

      // Push new keys to the end of the order list
      if (!this.cache[key]) {
        this.order.push(key)
      }

      // Store the cached data under the desingated key and include timestamp.
      this.cache[key] = {
        data,
        status,
        cachedAt: Date.now()
      } as QueryCache.Item<T>
    }
  }

  /**
   * @param key The key on which to store this cached value.
   * @param ttl The TTL (in seconds) for this particular retrieval.
   */
  public retrieve<T>(key: string | null, ttl?: number): QueryCache.Item<T> | null {
    if (!key) return null

    const cachedItem = this.cache[key]

    if (!cachedItem) {
      return null
    }

    if (this.mode === 'OFFLINE') {
      return cachedItem
    }

    // Check for either a base TTL or passed in TTL
    const _ttl = ttl ?? this.ttl
    const _ttlInSeconds = _ttl * 1000

    const isCacheStale = Date.now() - cachedItem.cachedAt > _ttlInSeconds

    if (isCacheStale) {
      return null
    }

    return cachedItem
  }

  public createKey(...parts: Array<string | number>): string | null {
    if (!parts || !parts.length) return null

    return parts.map(String).join('::')
  }

  /**
   * Provide the exact key to delete from the cache.
   */
  public deleteKeyWithExactMatch(key?: string | number | null): void {
    if (!key) return

    Reflect.deleteProperty(this.cache, key)
    this.order = this.order.filter((k) => k !== key)
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
    this.order = []
  }
}

export const queryCache = new Cache()
