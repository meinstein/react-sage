import { useBatchMutation } from '../useBatchMutation'
import { UseMutation } from './types'

export function useMutation<T, U>(
  method: (...params: T[]) => Promise<U>,
  onSuccess?: (res: U) => void
): UseMutation<T, U> {
  // useMutation is simply an implementation of useBatchMutation, but with
  // one set of params and one response object.
  const mutation = useBatchMutation(method, (response) => {
    return onSuccess(response[0])
  })

  return {
    ...mutation,
    result: {
      ...mutation.result,
      // De-structure the sole respones object from the list when available.
      response: mutation.result.response ? mutation.result.response[0] : null
    },
    invoke: (params): void => {
      // Put params in a list so they meet useBatchMutation's reqs.
      mutation.invoke([params])
    }
  }
}
