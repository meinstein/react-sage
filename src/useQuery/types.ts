export interface UseQueryCaching {
  /**
   * A unique key to store the query in the caching layer.
   * The final caching key is a combination of this key + the args passed to the method.
   */
  key?: string
  /**
   * In seconds.
   */
  ttl?: number
  /**
   * The amount of time to wait before retrying the cache for a pending result. In milliseconds.
   * Default is 250ms.
   */
  retryInterval?: number
}

export interface UseQueryOptions<T> {
  wait?: boolean
  args?: T | null
  caching?: UseQueryCaching
  retries?: number
}

export interface UseQueryResult<U> {
  result: U | null
  error: Error | null
  loading: boolean
  refresh: () => Promise<void>
}
