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

const getValidKey = (key?: string | number | null): string => {
  if (key === null) {
    throw new Error('[queryCache] cache key cannot be null')
  }

  if (key === undefined) {
    throw new Error('[queryCache] cache key cannot be undefined')
  }

  if (typeof key === 'string' && key.length === 0) {
    throw new Error('[queryCache] cache key canont be empty string')
  }

  return String(key)
}

const isExpired = (args: { cachedAtMs: number; maxAgeMs: number }): boolean => {
  return Date.now() - args.cachedAtMs > args.maxAgeMs
}

export class Cache {
  /**
   * A global TTL (in seconds) to cosnider when retrieving data from the cache.
   * Default is 0 - so important to configure for your needs.
   * NOTE: A more specific TTL can be applied to individual cache retrievals.
   */
  maxAge: number
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
    /**
     * Defaults to 0, which means users must configure this for the cache to do anything at all.
     */
    this.maxAge = 0
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

  get keys(): string[] {
    return Array.from(this.cache.keys())
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
   * @param ttl - this value (in seconds) is used for all cache retrievals that do not specify a TTL.
   * If a TTL is included in a given cache.retrieve(key, ttl), it will override this setting.
   *
   * @param maxSize - this value is to control how many entries are allowed in the cache before begin space is reclaimed for new ones.
   */
  public configure(configs: {
    /**
     * In seconds.
     */
    maxAge?: number
    maxSize?: number
    mode?: QueryCache.Mode
    type?: QueryCache.Type
  }): void {
    if (configs.mode) this.mode = configs.mode
    if (configs.type) this.type = configs.type
    if (typeof configs.maxAge === 'number' && configs.maxAge >= 0) this.maxAge = configs.maxAge
    if (typeof configs.maxSize === 'number' && configs.maxSize >= 0) this.maxSize = configs.maxSize
  }

  public upsert<T>(args: { key?: string | null; data: T; status: QueryCache.Status }): string | undefined {
    try {
      const validKey = getValidKey(args.key)

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
      const validKey = getValidKey(args.key)

      const cachedItem = this.cache.get(validKey)

      if (cachedItem === undefined) return undefined

      if (this.mode === 'OFFLINE') return cachedItem

      // Do not worry about flushing expired items until AFTER we check for offline mode.
      const expiredKeys = this.retrieveExpiredKeys()

      if (typeof args.ttl === 'number') {
        // Get the min value as between specific ttl and maxAge
        const minMaxAge = Math.min(args.ttl, this.maxAge)
        // If this particular key has a more specific TTL, then check it.
        if (isExpired({ maxAgeMs: minMaxAge * 1000, cachedAtMs: cachedItem.cachedAt })) {
          // If it is expired, then add it to the expired key list and delete the whole list of keys
          // before returning undefined.
          expiredKeys.push(validKey)
          this.deleteKeysWithExactMatch(expiredKeys)
          return undefined
        }
      }

      // If the cache item is available and still valid, make sure to still flush the other expired keys.
      this.deleteKeysWithExactMatch(expiredKeys)
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
    this.deleteKeysWithExactMatch([key])
  }

  /**
   * Provide a list of exact keys delete from the cache.
   */
  public deleteKeysWithExactMatch(keys?: Array<string | number | null | undefined>): void {
    keys?.forEach((key) => {
      try {
        const validKey = getValidKey(key)
        this.cache.delete(validKey)
      } catch (err) {
        // No-op
      }
    })

    this.save()
  }

  /**
   * Provide one or many parts of the keys that should be deleted from the cache.
   */
  public deleteKeysWithPartialMatch(...parts: Array<string | number>): void {
    if (parts.length) {
      const keysToDelete = this.keys.filter((key) => {
        return parts.every((part) => key.includes(String(part)))
      })

      this.deleteKeysWithExactMatch(keysToDelete)
    }
  }

  public retrieveExpiredKeys(): string[] {
    const expiredKeys: string[] = []
    const maxAgeInMs = this.maxAge * 1000

    this.cache.forEach((value, key) => {
      if (isExpired({ cachedAtMs: value.cachedAt, maxAgeMs: maxAgeInMs })) {
        expiredKeys.push(key)
      }
    })

    return expiredKeys
  }

  public clear(): void {
    this.cache.clear()
    this.save()
  }
}

export const queryCache = new Cache()
