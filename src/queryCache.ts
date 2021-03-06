/**
 * Helper class for dealing with in-memory cache.
 */

const NAMESPACE = '_queryCache'

export namespace QueryCache {
  export type Status = 'PENDING' | 'DONE' | 'FAILED' | 'EXPIRED'
  export type Mode = 'ONLINE' | 'OFFLINE'
  export type Type = 'IN_MEMORY' | 'SESSION_STORAGE' | 'LOCAL_STORAGE'

  export interface Item<T> {
    cachedAt: number
    data: T | null
    error: Error | null
    status: Status
  }

  export interface ItemCreateParams<T> {
    key: string
    value: Pick<Item<T>, 'data' | 'error' | 'status'>
  }
}

export class Cache {
  /**
   * A global TTL (in seconds) to cosnider when retrieving data from the cache.
   * Default is 0 - so important to configure for your needs.
   * NOTE: A more specific TTL can be applied to individual cache retrievals.
   */
  maxAge: number
  /**
   * https://web.dev/stale-while-revalidate/
   */
  staleWhileRevalidate: number
  /**
   * The maximum number of keys to be stored in the cache.
   * Default is 0 - so important to configure for your needs.
   */
  maxSize: number
  /**
   * Either online or offline.
   * When offline, TTLs and clearing are ignored - and cache is always returned if exists.
   */
  mode: QueryCache.Mode
  /**
   * Print warnings and tips to the console
   */
  logWarnings: boolean
  /**
   * Either in-memory or persisted.
   */
  type: QueryCache.Type

  _queryCache: Map<string, QueryCache.Item<unknown>>

  constructor() {
    this._queryCache = new Map()
    /**
     * Defaults to 0, which means users must configure this for the cache to do anything at all.
     */
    this.maxAge = 0
    /**
     * Defaults to 0, which means users must configure this for the cache to do anything at all.
     */
    this.staleWhileRevalidate = 0
    /**
     * Defaults to 0, which means users must configure this for the cache to do anything at all.
     */
    this.maxSize = 0
    this.mode = 'ONLINE'
    this.type = 'IN_MEMORY'
    this.logWarnings = true

    this.configure = this.configure.bind(this)
    this.upsert = this.upsert.bind(this)
    this.retrieve = this.retrieve.bind(this)
    this.createKey = this.createKey.bind(this)
    this.deleteKey = this.deleteKey.bind(this)
    this.deleteKeysWithPartialMatch = this.deleteKeysWithPartialMatch.bind(this)
    this.expireKey = this.expireKey.bind(this)
  }

  get cache(): Map<string, QueryCache.Item<unknown>> {
    try {
      if (this.type === 'LOCAL_STORAGE') {
        const _queryCacheFromStorage = window.localStorage.getItem(NAMESPACE)
        if (_queryCacheFromStorage) {
          this._queryCache = new Map(JSON.parse(_queryCacheFromStorage))
        }
      }

      if (this.type === 'SESSION_STORAGE') {
        const _queryCacheFromStorage = window.sessionStorage.getItem(NAMESPACE)
        if (_queryCacheFromStorage) {
          this._queryCache = new Map(JSON.parse(_queryCacheFromStorage))
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
        const serializedData = JSON.stringify(Array.from(this._queryCache.entries()))
        window.localStorage.setItem(NAMESPACE, serializedData)
      }

      if (this.type === 'SESSION_STORAGE') {
        const serializedData = JSON.stringify(Array.from(this._queryCache.entries()))
        window.sessionStorage.setItem(NAMESPACE, serializedData)
      }
    } catch (err) {
      // no-op
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
    staleWhileRevalidate?: number
    mode?: QueryCache.Mode
    type?: QueryCache.Type
    logWarnings?: boolean
  }): void {
    if (configs.mode) {
      this.mode = configs.mode
    }
    if (configs.type) {
      this.type = configs.type
    }
    if (configs.logWarnings) {
      this.logWarnings = configs.logWarnings
    }
    if (typeof configs.maxAge === 'number' && configs.maxAge >= 0) {
      this.maxAge = configs.maxAge
    }
    if (typeof configs.maxSize === 'number' && configs.maxSize >= 0) {
      this.maxSize = configs.maxSize
    }
    if (typeof configs.staleWhileRevalidate === 'number' && configs.staleWhileRevalidate >= 0) {
      this.staleWhileRevalidate = configs.staleWhileRevalidate
    }
  }

  private logWarning(...parts: string[]): void {
    if (this.logWarnings) {
      console.warn('[react-sage]', '[queryCache]', ...parts)
    }
  }

  public upsert<T>(item: QueryCache.ItemCreateParams<T>): boolean {
    // When maxSize is set to zero, then upsert is essentially a no-op.
    if (this.maxSize <= 0) {
      this.logWarning('maxSize must be configured to a value greater than 0 in to enable the query cache')
      return false
    }

    // When offline, do not add to the cache.
    if (this.mode === 'OFFLINE') return false

    if (this.cache.size >= this.maxSize) {
      // When exceeds max size, shift (ie, remove the oldest key) and delete from cache.
      // NOTE: ES6 maps retain the order in which keys are inserted, hence using pop method is reliable.
      const [oldestKey] = this.cache.entries().next().value
      // NOTE: delete from this.cache (instead of using deleteKey method) so that
      // save method is only invoked once (see below)
      if (oldestKey) this.cache.delete(oldestKey)
    }

    // NOTE: Delete operation is important precedent, as it ensures that the newly
    // set item is last in the list of entries (ie, the latest) and will not get
    // shifted too soon.
    this.cache.delete(item.key)
    this.cache.set(item.key, {
      data: item.value.data,
      error: item.value.error,
      status: item.value.status,
      cachedAt: Date.now()
    } as QueryCache.Item<T>)

    // Save the side effect of this delete + set
    this.save()

    return true
  }

  /**
   * @param key The key on which to store this cached value.
   * @param ttl The TTL (in seconds) for this particular retrieval.
   */
  public retrieve<T>(args: {
    key: string
    maxAge?: number
    staleWhileRevalidate?: number
  }): QueryCache.Item<T> | undefined {
    if (this.maxAge <= 0 && args.maxAge === undefined) {
      this.logWarning(args.key, 'maxAge must be configured to a value greater than 0 in order to enable proper caching')
      return undefined
    }

    if (this.staleWhileRevalidate <= 0 && args.staleWhileRevalidate === undefined) {
      this.logWarning(
        args.key,
        'staleWhileRevalidate must be configured to a value greater than 0 in order to enable proper caching'
      )
      return undefined
    }

    const cachedItem = this.cache.get(args.key) as QueryCache.Item<T> | undefined

    if (cachedItem === undefined) {
      return undefined
    }

    // When in OFFLINE mode, return all cached items right away.
    // Do not include pending items, though, as that will lead to misguided UI.
    if (this.mode === 'OFFLINE' && cachedItem.status !== 'PENDING') {
      return cachedItem
    }

    // NOTE: Date.now() and cachedAt are both in MS, therefore divide to convert to seconds.
    const cacheAge = (Date.now() - cachedItem.cachedAt) / 1000

    // Check Stale While Revalidate (must go before maxAge for obvious reasons)
    // Go by specificity: if a SWR value is provided in the retrieve params, use that, else use the default configuration.
    const staleWhileRevalidate = args.staleWhileRevalidate ?? this.staleWhileRevalidate

    if (cacheAge > staleWhileRevalidate) {
      this.deleteKey(args.key)
      return undefined
    }

    // Check max age
    // Go by specificity: if a maxAge value is provided in the retrieve params, use that, else use the default configuration.
    const maxAge = args.maxAge ?? this.maxAge
    if (cacheAge > maxAge) {
      const expiredItem = this.expireKey<T>(args.key)
      return expiredItem
    }

    return cachedItem
  }

  /**
   * This is essentially a helper-class.
   */
  public createKey(...parts: string[]): string | undefined {
    if (parts.length) return parts.join('::')
    return undefined
  }

  /**
   * Provide the exact key to delete from the cache.
   */
  public deleteKey(key: string): void {
    this.deleteKeys([key])
  }

  /**
   * Provide a list of exact keys delete from the cache.
   * Also saves the side effect of the delete operation (after bulk change is made)
   */
  public deleteKeys(keys: string[]): void {
    keys.forEach((key) => {
      this.cache.delete(key)
    })

    this.save()
  }

  /**
   * Provide one or many parts of the keys that should be deleted from the cache.
   */
  public deleteKeysWithPartialMatch(...parts: Array<string | number>): void {
    const keysToDelete: string[] = []

    if (parts.length) {
      this.cache.forEach((_, key) => {
        const shouldDelete = parts.every((part) => key.includes(String(part)))
        if (shouldDelete) keysToDelete.push(key)
      })

      if (keysToDelete.length) {
        this.deleteKeys(keysToDelete)
      }
    }
  }

  /**
   * This job of this method is to  update the status property of the provided key.
   * Also saves the side effect of this update.
   */
  public expireKey<T>(key: string): QueryCache.Item<T> | undefined {
    const value = this.cache.get(key)

    if (value) {
      const newValue = { ...value, status: 'EXPIRED' } as QueryCache.Item<T>
      const updatedMap = this.cache.set(key, newValue)
      const updatedValue = updatedMap.get(key) as QueryCache.Item<T>
      this.save()
      return updatedValue
    }

    return undefined
  }

  /**
   * Clears the map and saves the side effect of doing so.
   * Is a no-op when cahce is in OFFLINE mode.
   */
  public clear(): void {
    if (this.mode === 'ONLINE') {
      this.cache.clear()
      this.save()
    }
  }
}

export const queryCache = new Cache()
