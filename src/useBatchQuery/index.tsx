import * as React from 'react'

import { UseBatchQueryOptions, UseBatchQueryResult, FetchQueryArgs } from './types'
import { cache } from '../useQuery/cache'
import { sleep } from '../useQuery/utils'

export function useBatchQuery<T, U>(
  method: (args: T) => Promise<U>,
  options: UseBatchQueryOptions<T>
): UseBatchQueryResult<U> {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, args, retries = 0, cacheRetries = 5 } = options

  // Generate a cache key
  const stableArgs = React.useMemo(() => {
    const arrayOfStableArgs = args.map((arg) => JSON.stringify(arg, Object.keys(arg || {}).sort()))
    return JSON.stringify(arrayOfStableArgs)
  }, [args])

  const cacheKey = caching.key ? cache.createKey(caching.key, stableArgs) : null
  const retrieveCachedResult = React.useCallback(() => {
    return cache.retrieve<U[]>(cacheKey, caching.ttl)
  }, [cacheKey, caching.ttl])

  const [state, setState] = React.useState(() => {
    const cachedResult = retrieveCachedResult()
    return {
      result: cachedResult?.status === 'DONE' ? cachedResult.data : null,
      loading: cachedResult?.status === 'DONE' ? false : !wait,
      error: null
    }
  })

  const fetchQuery = React.useCallback(
    async ({ networkRetryCount = retries, cacheRetryCount = cacheRetries }: FetchQueryArgs): Promise<void> => {
      if (wait) return
      const cachedResult = retrieveCachedResult()
      if (cachedResult?.status === 'PENDING') {
        // Either utilize the recursive retryCount or the default initial number of cache retries.
        if (cacheRetryCount > 0) {
          await sleep(500 * (1 / cacheRetryCount))
          await fetchQuery({ cacheRetryCount: cacheRetryCount - 1 })
        }
      } else if (cachedResult?.status === 'DONE') {
        setState((prevState) => ({ ...prevState, result: cachedResult.data, loading: false }))
      } else {
        setState((prevState) => ({ ...prevState, loading: true }))
        try {
          cache.upsert(cacheKey, null, 'PENDING')
          const parsedArgs: T[] = JSON.parse(stableArgs).map((stableArg: string): T => JSON.parse(stableArg))
          const result = await Promise.all(parsedArgs.map(method))
          cache.upsert(cacheKey, result, 'DONE')
          setState((prevState) => ({ ...prevState, result, loading: false }))
        } catch (error) {
          cache.deleteKeyWithExactMatch(cacheKey)
          // Either utilize the recursive retryCount or the user-configured initial number of retries.
          if (networkRetryCount > 0) {
            await sleep(networkRetryCount * 250)
            await fetchQuery({ networkRetryCount: networkRetryCount - 1 })
          } else {
            setState((prevState) => ({ ...prevState, loading: false, error }))
          }
        }
      }
    },
    [stableArgs, method, retrieveCachedResult, wait, cacheKey, retries, cacheRetries]
  )

  // Initiate fetch on mount
  React.useEffect(() => {
    fetchQuery({})
  }, [fetchQuery])

  return {
    ...state,
    refresh: async (): Promise<void> => {
      cache.deleteKeyWithExactMatch(cacheKey)
      await fetchQuery({})
    }
  }
}
