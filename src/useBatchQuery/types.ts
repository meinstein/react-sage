import { UseQueryCaching } from '../useQuery/types'

export interface UseBatchQueryOptions<T> {
  /**
   * Required. Must provide a list of args.
   */
  args: T[]
  wait?: boolean
  caching?: UseQueryCaching
  retries?: number
}

export interface UseBatchQueryResult<U> {
  result: U[] | null
  error: Error | null
  loading: boolean
  refresh: () => Promise<void>
}
