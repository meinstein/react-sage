import * as React from 'react'

import { UseBatchMutation } from './types'

const INITIAL_STATE = { response: null, loading: false, error: null }

export function useBatchMutation<T, U>(
  method: (params: T) => Promise<U>,
  onSuccess?: (res: U[]) => void
): UseBatchMutation<T, U> {
  const [result, setResult] = React.useState(INITIAL_STATE)

  const invoke = React.useCallback(
    async (params: T[]) => {
      setResult((prevState) => ({ ...prevState, loading: true }))
      try {
        const response = await Promise.all(params.map(method))
        setResult(() => ({ response, error: null, loading: false }))
      } catch (error) {
        setResult(() => ({ error, response: null, loading: false }))
      }
    },
    [method]
  )

  React.useEffect(() => {
    if (onSuccess && result.response) {
      onSuccess(result.response)
      // Reset to initial state to pevent re-running this effect.
      setResult(INITIAL_STATE)
    }
  }, [onSuccess, result.response])

  return {
    result,
    invoke,
    reset: () => setResult(INITIAL_STATE)
  }
}
