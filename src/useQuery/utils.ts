/**
 * Promise-ified setTimeout for easier retry logic.
 */
export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
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

  public upsert<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      cachedAt: Date.now()
    } as CacheItem<T>
  }

  public retrieve<T>(key: string, ttl?: number): T | null {
    const cachedItem = this.cache[key]

    if (!cachedItem) return null

    let data = cachedItem.data

    if (ttl) {
      // ttl is in seconds - convert to ms
      data = Date.now() - cachedItem.cachedAt > ttl * 1000 ? null : data
    }

    return data
  }

  public remove(key: string): void {
    Reflect.deleteProperty(this.cache, key)
  }

  public reset(): void {
    this.cache = {}
  }
}
