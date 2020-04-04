export interface CachingOptions {
  refreshOnMount?: boolean
  // in seconds
  ttl?: number
}

export interface QueryOptions {
  wait?: boolean
  args?: {}
  caching?: CachingOptions
  retries?: number
}

export interface QueryResult<T> {
  result: T | null
  error: Error | null
  loading: boolean
  refresh: () => Promise<void>
}
