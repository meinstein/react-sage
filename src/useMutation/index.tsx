import * as React from 'react'

import { UseMutation } from './types'

export function useMutation<T, U>(
  method: (...args: T[]) => Promise<U>,
  onSuccess?: (res: U) => void,
  onError?: (err: Error | null) => void
): UseMutation<T, U> {
  const [result, setResult] = React.useState({
    response: null,
    loading: false,
    error: null
  })

  const invoke = React.useCallback(
    async (...params) => {
      setResult((prevState) => ({ ...prevState, loading: true }))
      try {
        const response = await method(...params)
        setResult((prevState) => ({
          ...prevState,
          response,
          loading: false
        }))
      } catch (error) {
        setResult((prevState) => ({
          ...prevState,
          error,
          loading: false
        }))
      }
    },
    [result.response, result.loading, result.error]
  )

  React.useEffect(() => {
    if (onSuccess && result.response) {
      onSuccess(result.response)
    }
  }, [result.response])

  React.useEffect(() => {
    if (onError && result.error) {
      onError(result.error)
    }
  }, [result.error])

  return {
    result,
    invoke,
    reset: (): void => {
      setResult({
        response: null,
        loading: false,
        error: null
      })
    }
  }
}
