import * as React from 'react'

import { QueryArgs, QueryResult } from './types'

export * from './types'

const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

const cache = {}

export function useQuery<T>({ method, wait, options = {} }: QueryArgs<T>): QueryResult<T> {
  // Parse out and create defaults for options
  const { caching = {}, args = {}, retries = 0 } = options
  // Generate a cache key
  const stableArgs = JSON.stringify(args || {}, Object.keys(args || {}).sort())
  const cacheKey = `${method}::${stableArgs}`

  const getCachedResult = (): T | null => {
    const cachedResult = cache[cacheKey]

    if (!cachedResult) return null
    if (caching.refreshOnMount) return null

    const { result, cachedAt } = cachedResult

    if (caching.ttl) {
      return Date.now() - cachedAt > caching.ttl * 1000 ? null : result
    }

    return result
  }

  const [state, setState] = React.useState(() => {
    const result = getCachedResult()
    return {
      result,
      loading: !wait,
      error: null
    }
  })

  const fetchQuery = React.useCallback(
    async (retryCount: number) => {
      if (wait) return
      const cachedResult = getCachedResult()
      if (cachedResult) {
        setState((prevState) => ({ ...prevState, result: cachedResult }))
      } else {
        setState((prevState) => ({ ...prevState, loading: true }))
        try {
          const result = await method(args)
          cache[cacheKey] = {
            result,
            cachedAt: Date.now()
          }
          setState((prevState) => ({ ...prevState, loading: false, result }))
        } catch (error) {
          if (retryCount > 0) {
            await sleep(retryCount * 250)
            return await fetchQuery(retryCount - 1)
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
      Reflect.deleteProperty(cache, cacheKey)
      return await fetchQuery(retries)
    }
  }
}
