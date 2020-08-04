import * as React from 'react'

import { UseQuery } from './useQuery'
import { queryCache } from './queryCache'

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
     * The number of times to attempt accessing the cache while a cached result is pending.
     */
    cacheRetries?: number
  }
}

const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useBatchQuery<T, U>(method: (args: T) => Promise<U>, options: UseBatchQuery.Options<T>) {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, args, retries = 0 } = options

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
    async (networkRetryCount: number = retries): Promise<void> => {
      if (wait) return
      const cachedResult = retrieveCachedResult()
      if (cachedResult?.status === 'PENDING') {
        await sleep(caching.retryInterval || 250)
        await fetchQuery()
      } else if (cachedResult?.status === 'DONE') {
        setState((prevState) => ({ ...prevState, result: cachedResult.data as U[], loading: false }))
      } else if (cachedResult?.status === 'FAILED') {
        setState((prevState) => ({ ...prevState, error: cachedResult.data as Error, loading: false }))
      } else {
        try {
          queryCache.upsert(cacheKey, null, 'PENDING')
          const parsedArgs: T[] = JSON.parse(stableArgs).map((stableArg: string): T => JSON.parse(stableArg))
          const result = await Promise.all(parsedArgs.map(method))
          queryCache.upsert(cacheKey, result, 'DONE')
          setState((prevState) => ({ ...prevState, result, loading: false }))
        } catch (error) {
          // Either utilize the recursive retryCount or the user-configured initial number of retries.
          if (networkRetryCount > 0) {
            await sleep(networkRetryCount * 250)
            await fetchQuery(networkRetryCount - 1)
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
  }, [fetchQuery])

  return {
    ...state,
    refresh: async (): Promise<void> => {
      queryCache.deleteKeyWithExactMatch(cacheKey)
      await fetchQuery()
    }
  }
}
