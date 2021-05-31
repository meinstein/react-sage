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

const validateKey = (key: string | null): string => {
  if (key === null) {
    throw new Error('[queryCache] cache key cannot be null')
  }

  if (typeof key === 'string' && key.length === 0) {
    throw new Error('[queryCache] cache key canont be empty string')
  }

  return key
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: Map<string, QueryCache.Item<any>>

  constructor() {
    this.cache = new Map()

    this.ttl = 0
    this.maxSize = 100
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
  public configure(configs: { ttl?: number; maxSize?: number; mode?: QueryCache.Mode }): void {
    if (configs.ttl) this.ttl = configs.ttl
    if (configs.mode) this.mode = configs.mode
    if (configs.maxSize) this.maxSize = configs.maxSize
  }

  public upsert<T>(key: string | null, data: T, status: QueryCache.Status): string | undefined {
    try {
      const validKey = validateKey(key)

      if (this.cache.size >= this.maxSize) {
        const lastKey = Array.from(this.cache.keys()).pop()
        // When exceeds max size, shift (ie, remove the oldest key) and delete from cache.
        this.deleteKeyWithExactMatch(lastKey)
      }

      // Store the cached data under the desingated key and include timestamp.
      this.cache.set(validKey, {
        data,
        status,
        cachedAt: Date.now()
      } as QueryCache.Item<T>)

      return validKey
    } catch (err) {
      return undefined
    }
  }

  /**
   * @param key The key on which to store this cached value.
   * @param ttl The TTL (in seconds) for this particular retrieval.
   */
  public retrieve<T>(key: string | null, ttl?: number): QueryCache.Item<T> | undefined {
    try {
      const validKey = validateKey(key)

      const cachedItem = this.cache.get(validKey)

      if (cachedItem === undefined) return undefined

      if (this.mode === 'OFFLINE') return cachedItem

      // Check for either a base TTL or passed in TTL
      const _ttl = ttl ?? this.ttl
      const _ttlInSeconds = _ttl * 1000

      const isCacheStale = Date.now() - cachedItem.cachedAt > _ttlInSeconds

      if (isCacheStale) return undefined

      return cachedItem
    } catch (err) {
      return undefined
    }
  }

  public createKey(...parts: Array<string | number>): string | undefined {
    if (parts.length) return parts.map(String).join('::')
  }

  /**
   * Provide the exact key to delete from the cache.
   */
  public deleteKeyWithExactMatch(key?: string | number | null): void {
    if (key) this.cache.delete(String(key))
  }

  /**
   * Provide one or many parts of the keys that should be deleted from the cache.
   */
  public deleteKeysWithPartialMatch(...parts: Array<string | number>): void {
    if (parts.length) {
      this.cache.forEach((_, key) => {
        const hasPartialMatch = parts.every((part) => key.includes(String(part)))
        if (hasPartialMatch) this.deleteKeyWithExactMatch(key)
      })
    }
  }

  public reset(): void {
    this.cache.clear()
  }
}

export const queryCache = new Cache()
