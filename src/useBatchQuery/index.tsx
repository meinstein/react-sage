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
    console.log('here')
    const arrayOfStableArgs = args.map((arg) => JSON.stringify(arg, Object.keys(arg || {}).sort()))
    return JSON.stringify(arrayOfStableArgs)
  }, [args])

  const cacheKey = caching.key ? cache.createKey(caching.key, stableArgs) : null
  const retrieveCachedResult = React.useCallback((): U[] | null => {
    return cache.retrieve<U[]>(cacheKey, caching.ttl)
  }, [cacheKey, caching.ttl])

  const [state, setState] = React.useState(() => {
    const cachedResult = retrieveCachedResult()
    return {
      result: cachedResult,
      loading: cachedResult ? false : !wait,
      error: null
    }
  })

  const fetchQuery = React.useCallback(
    async (retryCount = retries): Promise<void> => {
      if (wait) return
      const cachedResult = retrieveCachedResult()
      if (cachedResult) {
        setState((prevState) => ({ ...prevState, result: cachedResult }))
      } else {
        setState((prevState) => ({ ...prevState, loading: true }))
        try {
          const parsedArgs: T[] = JSON.parse(stableArgs).map((stableArg: string): T => JSON.parse(stableArg))
          const result = await Promise.all(parsedArgs.map(method))
          cache.upsert(cacheKey, result)
          setState((prevState) => ({ ...prevState, result, loading: false }))
        } catch (error) {
          if (retryCount > 0) {
            await sleep(retryCount * 250)
            await fetchQuery(retryCount - 1)
          } else {
            setState((prevState) => ({ ...prevState, loading: false, error }))
          }
        }
      }
    },
    [stableArgs, method, retrieveCachedResult, wait, cacheKey, retries]
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
