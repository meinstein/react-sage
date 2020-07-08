import * as React from 'react'

import { UseBatchQueryOptions, UseBatchQueryResult } from './types'
import { cache } from '../useQuery/cache'
import { sleep } from '../useQuery/utils'

export function useBatchQuery<T, U>(
  method: (args: T) => Promise<U>,
  options: UseBatchQueryOptions<T>
): UseBatchQueryResult<U> {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, args, retries = 0 } = options

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
          cache.upsert(cacheKey, null, 'PENDING')
          const parsedArgs: T[] = JSON.parse(stableArgs).map((stableArg: string): T => JSON.parse(stableArg))
          const result = await Promise.all(parsedArgs.map(method))
          cache.upsert(cacheKey, result, 'DONE')
          setState((prevState) => ({ ...prevState, result, loading: false }))
        } catch (error) {
          // Either utilize the recursive retryCount or the user-configured initial number of retries.
          if (networkRetryCount > 0) {
            await sleep(networkRetryCount * 250)
            await fetchQuery(networkRetryCount - 1)
          } else {
            cache.upsert(cacheKey, error, 'FAILED')
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
      cache.deleteKeyWithExactMatch(cacheKey)
      await fetchQuery()
    }
  }
}
