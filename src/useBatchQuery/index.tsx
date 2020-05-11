import * as React from 'react'

import { UseBatchQueryOptions, UseBatchQueryResult } from './types'
import { sleep, Cache } from '../useQuery/utils'

export const cache = new Cache()

export function useBatchQuery<T, U>(
  method: (args: T) => Promise<U>,
  options: UseBatchQueryOptions<T>
): UseBatchQueryResult<U> {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, args, retries = 0 } = options
  // Generate a unique + stable cache key
  const stableArgs = args.reduce((prev, curr) => {
    return prev + JSON.stringify(curr, Object.keys(curr || {}).sort())
  }, '')
  const cacheKey = caching.key ? `${caching.key}::${stableArgs}` : null

  const retrieveCachedResult = (): U[] | null => {
    return cache.retrieve<U[]>(cacheKey, caching.ttl)
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
        const result = await Promise.all(args.map(method))
        cache.upsert(cacheKey, result)
        setState((prevState) => ({ ...prevState, result, loading: false }))
      } catch (error) {
        if (retryCount > 0) {
          await sleep(retryCount * 250)
          await fetchQuery(retryCount - 1)
        } else {
          setState((prevState) => ({ ...prevState, error, loading: false }))
        }
      }
    }
  }

  // This triggers on mount or when done waiting
  React.useEffect(() => {
    fetchQuery(retries)
  }, [wait, cacheKey, stableArgs])

  return {
    ...state,
    refresh: async (): Promise<void> => {
      cache.remove(cacheKey)
      await fetchQuery(retries)
    }
  }
}
