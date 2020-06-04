import * as React from 'react'

import { UseBatchMutation } from './types'

export function useBatchMutation<T, U>(
  method: (params: T) => Promise<U>,
  onSuccess?: (res: U[]) => void
): UseBatchMutation<T, U> {
  const [result, setResult] = React.useState({
    response: null,
    loading: false,
    error: null
  })

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
    [method, setResult]
  )

  React.useEffect(() => {
    if (onSuccess && result.response) {
      onSuccess(result.response)
    }
  }, [onSuccess, result.response])

  return {
    result,
    invoke,
    reset: (): void => {
      setResult({ response: null, loading: false, error: null })
    }
  }
}
