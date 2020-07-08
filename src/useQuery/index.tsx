import { useBatchQuery } from '../useBatchQuery'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQuery<T, U>(
  method: (args?: T | null) => Promise<U>,
  options?: UseQueryOptions<T>
): UseQueryResult<U> {
  // useQuery is simply an implementation of useBatchQuery, therefore must adjust any args
  // so they become compatible with useBatchQuery's reqs.
  const query = useBatchQuery(method, {
    ...(options || {}),
    // Can be [undefined] as well, which is ok. If empty, useBatchQuery will not invoke it.
    args: [options?.args]
  })

  return {
    ...query,
    // De-structure the sole result object from the list when available.
    result: query.result ? query.result[0] : null
  }
}
