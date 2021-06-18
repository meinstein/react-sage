import { useBatchQuery } from './useBatchQuery'

export namespace UseQuery {
  export interface Options<T> {
    /**
     * Must provide this key to options.
     */
    args: T
    wait?: boolean
    caching?: Caching
    polling?: Polling
    retries?: number
  }

  export interface Caching {
    /**
     * A unique key to store the query in the caching layer.
     * The final caching key is a combination of this key + the args passed to the method.
     */
    key?: string
    /**
     * In seconds.
     */
    maxAge?: number
    /**
     * In seconds.
     */
    staleWhileRevalidate?: number
    /**
     * The amount of time to wait before retrying the cache for a pending result. In milliseconds.
     * Default is 250ms.
     */
    retryInterval?: number
  }

  export interface Polling {
    /**
     * Number representing the delay in ms. Set to `null` to "pause" the interval.
     */
    delay: number | null
    /**
     * Should invoking the the query be paused when the document visiblilty changes?
     * Default is true.
     * https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
     */
    pauseOnVisibilityChange?: boolean
  }

  export interface Response<U> {
    result: U | null
    refresh: () => Promise<void>
    error: Error | null
    loading: boolean
  }
}

export function useQuery<T, U>(method: (args: T) => Promise<U>, options: UseQuery.Options<T>): UseQuery.Response<U> {
  // useQuery is simply an implementation of useBatchQuery, therefore must adjust any args
  // so they become compatible with useBatchQuery's reqs.
  const query = useBatchQuery(method, {
    ...(options || {}),
    // Can be [undefined | null] as well, which is ok.
    // If empty list, useBatchQuery will not invoke it.
    args: [options.args]
  })

  return {
    ...query,
    // De-structure the sole result object from the list when available.
    result: query.result ? query.result[0] : null
  }
}
