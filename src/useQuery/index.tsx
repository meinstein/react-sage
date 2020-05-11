import * as React from 'react'

import { useBatchQuery } from '..'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQuery<T, U>(method: (args: T) => Promise<U>, options?: UseQueryOptions<T>): UseQueryResult<U> {
  // useQuery is simply an implementation of useBatchQuery, therefore must adjust any args
  // so they become compatible with useBatchQuery's reqs.
  const query = useBatchQuery(method, { ...(options || {}), args: options.args ? [options.args] : [] })

  return {
    ...query,
    // De-structure the sole result object from the list when available.
    result: query.result ? query.result[0] : null
  }
}
