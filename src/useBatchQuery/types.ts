import { UseQueryCaching } from '../useQuery/types'

export interface UseBatchQueryOptions<T> {
  /**
   * Required. Must provide a list of args.
   */
  args: T[]
  /**
   * The query will not fire on mount while this is set to true.
   */
  wait?: boolean
  /**
   * Caching-related options.
   */
  caching?: UseQueryCaching
  /**
   * The number of network retries to attempt when a query raises an exception.
   */
  retries?: number
  /**
   * The number of times to attempt accessing the cache while a cached result is pending.
   */
  cacheRetries?: number
}

export interface UseBatchQueryResult<U> {
  result: U[] | null
  error: Error | null
  loading: boolean
  refresh: () => Promise<void>
}

export interface FetchQueryArgs {
  networkRetryCount?: number
  cacheRetryCount?: number
}
