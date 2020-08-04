import { useBatchMutation } from './useBatchMutation'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useMutation<T, U>(method: (...params: T[]) => Promise<U>, onSuccess?: (res: U) => void) {
  // useMutation is simply an implementation of useBatchMutation, but with
  // one set of params and one response object.
  const mutation = useBatchMutation(method, (response) => {
    onSuccess && onSuccess(response[0])
  })

  return {
    ...mutation,
    result: {
      ...mutation.result,
      // De-structure the sole respones object from the list when available.
      response: mutation.result.response ? mutation.result.response[0] : null
    },
    invoke: (params: T): void => {
      // Put params in a list so they meet useBatchMutation's reqs.
      mutation.invoke([params])
    }
  }
}
