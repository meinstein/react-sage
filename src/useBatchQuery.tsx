import * as React from 'react'

import { UseQuery } from './useQuery'
import { useInterval } from './useInterval'
import { queryCache } from './queryCache'
import { sleep } from './utils'

export namespace UseBatchQuery {
  export interface Options<T> {
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
    caching?: UseQuery.Caching
    /**
     * The number of network retries to attempt when a query raises an exception.
     */
    retries?: number
    /**
     * Polling-related options.
     */
    polling?: UseQuery.Polling
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useBatchQuery<T, U>(method: (args: T) => Promise<U>, options: UseBatchQuery.Options<T>) {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, polling, args, retries = 0 } = options
  // defaults
  const delay = polling?.delay ? polling.delay : null
  const pauseOnVisibilityChange = polling?.pauseOnVisibilityChange ? polling.pauseOnVisibilityChange : true

  // Generate a cache key
  const stableArgs = React.useMemo(() => {
    const arrayOfStableArgs = args.map((arg) => JSON.stringify(arg, Object.keys(arg || {}).sort()))
    return JSON.stringify(arrayOfStableArgs)
  }, [args])

  const cacheKey = caching.key ? queryCache.createKey(caching.key, stableArgs) : null
  const retrieveCachedResult = React.useCallback(() => {
    return queryCache.retrieve<U[]>(cacheKey, caching.ttl)
  }, [cacheKey, caching.ttl])

  const [state, setState] = React.useState(() => {
    const cachedResult = retrieveCachedResult()
    return {
      result: cachedResult?.status === 'DONE' ? (cachedResult.data as U[]) : null,
      loading: cachedResult?.status === 'DONE' || cachedResult?.status === 'FAILED' ? false : !wait,
      error: cachedResult?.status === 'FAILED' ? (cachedResult.data as Error) : null
    }
  })

  const fetchQuery = React.useCallback(
    async (networkRetryCount?: number): Promise<void> => {
      /**
       * Nothing further to do when the query is told to wait.
       */
      if (wait) return
      /**
       * Check the in-mem cache for anything about this query.
       */
      const cachedResult = retrieveCachedResult()
      /**
       * The query may already be in-flight from a different invocation, in which case
       * we will wait and retry after a specified interval.
       * NOTE: If this invocation is attempting network retries, then ignore the cached PENDING state
       * and move through to the network again.
       */
      if (cachedResult?.status === 'PENDING' && networkRetryCount === undefined) {
        setState((prevState) => ({ ...prevState, loading: true }))
        await sleep(caching.retryInterval || 250)
        await fetchQuery()
        /**
         * If you end up here it means that a previous invocation of this query has completed
         * and been stored in the cache. Therefore, we can proceed with the cached result.
         */
      } else if (cachedResult?.status === 'DONE') {
        setState((prevState) => ({ ...prevState, result: cachedResult.data as U[], loading: false }))
        /**
         * If you end up here it menas that a previous invocation of this query has filed and
         * been stored in the cache. Therefore, we can proceed with the cached result.
         */
      } else if (cachedResult?.status === 'FAILED') {
        setState((prevState) => ({ ...prevState, error: cachedResult.data as Error, loading: false }))
        /**
         * If you end up here, the query is not recorded in the cache and it is time to use the network.
         */
      } else {
        try {
          setState((prevState) => ({ ...prevState, loading: true }))
          /**
           * Notify the cache that this query is in flight.
           */
          queryCache.upsert(cacheKey, null, 'PENDING')
          /**
           * Parse the stable, stringified args into JS and invoke the underlying fetch method.
           */
          const parsedArgs: T[] = JSON.parse(stableArgs).map((stableArg: string): T => JSON.parse(stableArg))
          const result = await Promise.all(parsedArgs.map(method))
          /**
           * If you end up here, it means that all went well and the data returned smoothly.
           */
          queryCache.upsert(cacheKey, result, 'DONE')
          setState((prevState) => ({ ...prevState, result, loading: false }))
        } catch (error) {
          /**
           * The first invocation of the query to fail will lead the retry charge.
           */
          const _retries = networkRetryCount ?? retries
          if (_retries > 0) {
            // Either utilize the recursive retryCount or the user-configured initial number of retries.
            await sleep(_retries * 250)
            await fetchQuery(_retries - 1)
          } else {
            queryCache.upsert(cacheKey, error, 'FAILED')
            setState((prevState) => ({ ...prevState, loading: false, error }))
          }
        }
      }
    },
    [stableArgs, method, retrieveCachedResult, wait, cacheKey, retries, caching.retryInterval]
  )

  // Initiate fetch on mount
  React.useEffect(() => {
    fetchQuery()
  }, [fetchQuery, wait])

  const refresh = React.useCallback(async (): Promise<void> => {
    // console.log(document.visibilityState, document.visibilityState, polling.pauseOnVisibilityChange, polling)
    if (document.visibilityState && document.visibilityState === 'hidden' && pauseOnVisibilityChange) return
    // Deleted the cache key before fetching again ensures a "hard" refresh.
    queryCache.deleteKeyWithExactMatch(cacheKey)
    await fetchQuery()
  }, [cacheKey, fetchQuery, pauseOnVisibilityChange])

  // The value of `wait` also dictates whether the interval should run its course.
  const reconciledDelay = wait ? null : delay
  useInterval(refresh, reconciledDelay)

  return {
    ...state,
    refresh
  }
}
