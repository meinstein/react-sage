/**
 * Helper class for dealing with in-memory cache.
 */

export namespace QueryCache {
  export type Status = 'PENDING' | 'DONE' | 'FAILED'
  export type Mode = 'ONLINE' | 'OFFLINE'
  export type Type = 'IN_MEMORY' | 'SESSION_STORAGE' | 'LOCAL_STORAGE'

  export interface Item<T> {
    cachedAt: number
    data: T | Error
    status: Status
  }
}

const validateKey = (key?: string | null): string => {
  if (key === null) {
    throw new Error('[queryCache] cache key cannot be null')
  }

  if (key === undefined) {
    throw new Error('[queryCache] cache key cannot be undefined')
  }

  if (typeof key === 'string' && key.length === 0) {
    throw new Error('[queryCache] cache key canont be empty string')
  }

  return key
}

export class Cache {
  /**
   * A global TTL to cosnider when retrieving data from the cache.
   * Default is 0 - so important to configure for your needs.
   * NOTE: A more specific TTL can be applied to individual cache retrievals.
   */
  ttl: number
  /**
   * The maximum number of keys to be stored in the cache.
   * Default is 0 - so important to configure for your needs.
   */
  maxSize: number
  /**
   * Either online or offline.
   * When offline, TTLs are ignored and cache is returned if exists.
   */
  mode: QueryCache.Mode
  /**
   * Either in-memory or persisted.
   */
  type: QueryCache.Type

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _queryCache: Map<string, QueryCache.Item<any>>

  constructor() {
    this._queryCache = new Map()
    this.ttl = 0
    /**
     * Defaults to 0, which means users must configure this for the cache to do anything at all.
     */
    this.maxSize = 0
    this.mode = 'ONLINE'
    this.type = 'IN_MEMORY'

    this.configure = this.configure.bind(this)
    this.upsert = this.upsert.bind(this)
    this.retrieve = this.retrieve.bind(this)
    this.createKey = this.createKey.bind(this)
    this.deleteKeyWithExactMatch = this.deleteKeyWithExactMatch.bind(this)
    this.deleteKeysWithPartialMatch = this.deleteKeysWithPartialMatch.bind(this)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get cache(): Map<string, QueryCache.Item<any>> {
    try {
      if (this.type === 'LOCAL_STORAGE') {
        const _queryCacheFromStorage = window.localStorage._queryCache
        if (_queryCacheFromStorage) {
          this._queryCache = new Map(JSON.parse(localStorage._queryCache))
        }
      }

      if (this.type === 'SESSION_STORAGE') {
        const _queryCacheFromStorage = window.sessionStorage._queryCache
        if (_queryCacheFromStorage) {
          this._queryCache = new Map(JSON.parse(sessionStorage._queryCache))
        }
      }

      return this._queryCache
    } catch (err) {
      return this._queryCache
    }
  }

  /**
   * Calling this method persists the in-mem map to local storage.
   */
  private save(): void {
    try {
      if (this.type === 'LOCAL_STORAGE') {
        window.localStorage._queryCache = JSON.stringify(Array.from(this._queryCache.entries()))
      }

      if (this.type === 'SESSION_STORAGE') {
        window.sessionStorage._queryCache = JSON.stringify(Array.from(this._queryCache.entries()))
      }
    } catch (err) {
      // no-op
      return
    }
  }

  /**
   * TTL - this value (in seconds) is used for all cache retrievals that do not specify a TTL.
   * If a TTL is included in a given cache.retrieve(key, ttl), it will override this setting.
   *
   * maxSize - this value is to control how many entries are allowed in the cache before begin space is reclaimed for new ones.
   */
  public configure(configs: { ttl?: number; maxSize?: number; mode?: QueryCache.Mode; type?: QueryCache.Type }): void {
    if (configs.mode) this.mode = configs.mode
    if (configs.type) this.type = configs.type
    if (typeof configs.ttl === 'number' && configs.ttl >= 0) this.ttl = configs.ttl
    if (typeof configs.maxSize === 'number' && configs.maxSize >= 0) this.maxSize = configs.maxSize
  }

  public upsert<T>(args: { key?: string | null; data: T; status: QueryCache.Status }): string | undefined {
    try {
      const validKey = validateKey(args.key)

      // When maxSize is set to zero, then upsert is essentially a no-op.
      if (this.maxSize === 0) return

      if (this.cache.size >= this.maxSize) {
        // When exceeds max size, shift (ie, remove the oldest key) and delete from cache.
        // NOTE: ES6 maps retain the order in which keys are inserted, hence pop is accurate method for doing this.
        const lastKey = Array.from(this.cache.keys()).pop()
        this.deleteKeyWithExactMatch(lastKey)
      }

      // Store the cached data under the desingated key and include timestamp.
      this.cache.set(validKey, {
        data: args.data,
        status: args.status,
        cachedAt: Date.now()
      } as QueryCache.Item<T>)

      this.save()

      return validKey
    } catch (err) {
      return undefined
    }
  }

  /**
   * @param key The key on which to store this cached value.
   * @param ttl The TTL (in seconds) for this particular retrieval.
   */
  public retrieve<T>(args: { key?: string | null; ttl?: number }): QueryCache.Item<T> | undefined {
    try {
      const validKey = validateKey(args.key)

      const cachedItem = this.cache.get(validKey)

      if (cachedItem === undefined) return undefined

      if (this.mode === 'OFFLINE') return cachedItem

      // Check for either a base TTL or passed in TTL
      const _ttl = args.ttl ?? this.ttl
      const _ttlInMilliseconds = _ttl * 1000

      const isCacheStale = Date.now() - cachedItem.cachedAt > _ttlInMilliseconds

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
    if (key) {
      this.cache.delete(String(key))
      this.save()
    }
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

  public clear(): void {
    this.cache.clear()
    this.save()
  }
}

export const queryCache = new Cache()
