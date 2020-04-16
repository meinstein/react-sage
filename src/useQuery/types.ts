export interface UseQueryCaching {
  refreshOnMount?: boolean
  // in seconds
  ttl?: number
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
