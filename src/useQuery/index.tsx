import * as React from 'react'

import { UseQueryOptions, UseQueryResult } from './types'
import { sleep, Cache, hashCode } from './utils'

export const cache = new Cache()

export function useQuery<T, U>(method: (args: T) => Promise<U>, options?: UseQueryOptions<T>): UseQueryResult<U> {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, args, retries = 0 } = options || {}
  // Generate a cache key
  const stableArgs = JSON.stringify(args, Object.keys(args || {}).sort())
  const stringifiedMethod = method.toString()
  const cacheKey = React.useMemo(() => {
    return hashCode(stringifiedMethod + stableArgs)
  }, [stringifiedMethod, stableArgs])

  const retrieveCachedResult = (): U | null => {
    return caching.refreshOnMount ? null : cache.retrieve<U>(cacheKey, caching.ttl)
  }

  const [state, setState] = React.useState(() => {
    const cachedResult = retrieveCachedResult()
    return {
      result: cachedResult,
      loading: cachedResult ? false : !wait,
      error: null
    }
  })

  const fetchQuery = async (retryCount: number): Promise<void> => {
    if (wait) return
    const cachedResult = retrieveCachedResult()
    if (cachedResult) {
      setState((prevState) => ({ ...prevState, result: cachedResult }))
    } else {
      setState((prevState) => ({ ...prevState, loading: true }))
      try {
        const result = await method(args)
        cache.upsert(cacheKey, result)
        setState((prevState) => ({ ...prevState, loading: false, result }))
      } catch (error) {
        if (retryCount > 0) {
          await sleep(retryCount * 250)
          await fetchQuery(retryCount - 1)
        } else {
          setState((prevState) => ({ ...prevState, loading: false, error }))
        }
      }
    }
  }

  // This triggers on mount or when done waiting
  React.useEffect(() => {
    fetchQuery(retries)
  }, [cacheKey, wait])

  return {
    ...state,
    refresh: async (): Promise<void> => {
      cache.remove(cacheKey)
      await fetchQuery(retries)
    }
  }
}
