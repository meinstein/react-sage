import * as React from 'react'

import { QueryOptions, QueryResult } from './types'
import { sleep, Cache } from './utils'

export * from './types'

export const cache = new Cache()

export function useQuery<T>(
  method: (...agrs: Array<string | number | boolean | {}>) => Promise<T>,
  options?: QueryOptions
): QueryResult<T> {
  // Parse out and create defaults for options
  const { wait = false, caching = {}, args = {}, retries = 0 } = options || {}
  // Generate a cache key
  const stableArgs = JSON.stringify(args, Object.keys(args).sort())
  // Ensure that the method has a name when it was created. Cannot generate cache otherwise.
  const cacheKey = method.name && method.name !== 'anonymous' && `${method.name}::${stableArgs}`

  const [state, setState] = React.useState(() => {
    const cachedResult = cacheKey && cache.retrieve<T>(cacheKey, caching.ttl)
    return {
      result: cachedResult,
      loading: !wait,
      error: null
    }
  })

  const fetchQuery = React.useCallback(
    async (retryCount: number) => {
      if (wait) return
      const cachedResult = cacheKey && cache.retrieve<T>(cacheKey, caching.ttl)
      if (cachedResult) {
        setState((prevState) => ({ ...prevState, result: cachedResult }))
      } else {
        setState((prevState) => ({ ...prevState, loading: true }))
        try {
          const result = await method(args)
          cacheKey && cache.upsert(cacheKey, result)
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
    },
    [state.loading, state.result, state.error, cacheKey, wait]
  )

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
