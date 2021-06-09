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

  const cacheKey = caching.key ? queryCache.createKey(caching.key, stableArgs) : undefined
  const retrieveCachedResult = React.useCallback(() => {
    if (cacheKey)
      return queryCache.retrieve<U[]>({
        key: cacheKey,
        maxAge: caching.maxAge,
        staleWhileRevalidate: caching.staleWhileRevalidate
      })
    return undefined
  }, [cacheKey, caching.maxAge, caching.staleWhileRevalidate])

  const [state, setState] = React.useState(() => {
    const cachedResult = retrieveCachedResult()

    if (cachedResult) {
      return {
        result: cachedResult.data,
        error: cachedResult.error,
        loading: cachedResult.status === 'PENDING' ? true : !wait
      }
    }

    return {
      result: null,
      error: null,
      loading: !wait
    }
  })

  const fetchQuery = React.useCallback(
    async (networkRetryCount?: number): Promise<void> => {
      /**
       * Nothing further to do when the query is told to wait.
       */
      if (wait) return
      /**
       * Check the cache for anything about this query.
       */
      const cachedResult = retrieveCachedResult()
      /**
       * The query may already be in-flight from a different invocation, in which case
       * we will wait and retry after a specified interval.
       * NOTE: If this invocation is attempting network retries, then ignore the cached PENDING state
       * and move through to the network again.
       */
      if (cachedResult?.status === 'PENDING' && networkRetryCount === undefined) {
        setState(() => {
          return {
            result: cachedResult.data,
            error: cachedResult.error,
            loading: true
          }
        })
        // NOTE: 250 is a hard-coded opinion about how long to wait before accessing the cache again to check
        // for a result.
        await sleep(250)
        await fetchQuery()
        /**
         * If we end up here it means that a previous invocation of this query has completed
         * and been stored in the cache. Therefore, we can proceed with the cached result.
         */
      } else if (cachedResult?.status === 'DONE') {
        setState(() => {
          return {
            result: cachedResult.data,
            error: cachedResult.error,
            loading: false
          }
        })
        /**
         * If we end up here it means that a previous invocation of this query has filed and
         * been stored in the cache. Therefore, we can proceed with the cached result.
         */
      } else if (cachedResult?.status === 'FAILED') {
        setState(() => {
          return {
            result: cachedResult.data,
            error: cachedResult.error,
            loading: false
          }
        })
        /**
         * If we end up here, the query is not recorded in the cache and it is time to use the network.
         */
      } else {
        try {
          setState((prevState) => {
            /**
             * Notify the cache that this query is in flight.
             */
            if (cacheKey) {
              queryCache.upsert({
                key: cacheKey,
                value: {
                  status: 'PENDING',
                  // NOTE: keep any previous results or errors in the cache.
                  // This allows UIs to do background fetches without clearing all data.
                  data: prevState.result,
                  error: prevState.error
                }
              })
            }
            return {
              ...prevState,
              loading: true
            }
          })
          /**
           * Parse the stable, stringified args into JS and invoke the underlying fetch method.
           */
          const parsedArgs: T[] = JSON.parse(stableArgs).map((stableArg: string): T => JSON.parse(stableArg))
          const result = await Promise.all(parsedArgs.map(method))
          /**
           * If we end up here, it means that all went well and the data returned smoothly.
           */
          setState((prevState) => {
            if (cacheKey) {
              queryCache.upsert({
                key: cacheKey,
                value: {
                  status: 'DONE',
                  data: result,
                  // Can nullify any error on a successul network response.
                  error: null
                }
              })
            }
            return {
              result,
              error: null,
              loading: false
            }
          })
        } catch (error) {
          /**
           * The first invocation of the query to fail will lead the retry charge.
           */
          const _retries = networkRetryCount ?? retries
          if (_retries > 0) {
            const retryInterval = caching.retryInterval ?? 250
            // Either utilize the recursive retryCount or the user-configured initial number of retries.
            await sleep(_retries * retryInterval)
            await fetchQuery(_retries - 1)
          } else {
            setState((prevState) => {
              if (cacheKey) {
                queryCache.upsert({
                  key: cacheKey,
                  value: {
                    error,
                    status: 'FAILED',
                    // NOTE: keep previous result around (if exists) so that UI can display the data
                    // alongside the error (if applicable)
                    data: prevState.result
                  }
                })
              }
              return {
                ...prevState,
                error,
                loading: false
              }
            })
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
    if (document.visibilityState && document.visibilityState === 'hidden' && pauseOnVisibilityChange) return
    // Deleted the cache key before fetching again ensures a "hard" refresh.
    if (cacheKey) queryCache.expireKey(cacheKey)
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
