import { useBatchQuery } from './useBatchQuery'

export namespace UseQuery {
  export interface Options<T> {
    /**
     * Must provide this key to options.
     */
    args: T
    wait?: boolean
    caching?: Caching
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
    ttl?: number
    /**
     * The amount of time to wait before retrying the cache for a pending result. In milliseconds.
     * Default is 250ms.
     */
    retryInterval?: number
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useQuery<T, U>(method: (args: T) => Promise<U>, options: UseQuery.Options<T>) {
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
