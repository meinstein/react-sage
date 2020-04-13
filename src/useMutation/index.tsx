import * as React from 'react'

import { MutationResponse } from './types'

export * from './types'

export function useMutation<T>(
  method: (...args: Array<string | number | boolean | {}>) => Promise<T>,
  onSuccess?: (response: T) => void
): MutationResponse<T> {
  const [result, setResult] = React.useState({
    response: null,
    loading: false,
    error: null
  })

  const invoke = React.useCallback(
    async (...args: Array<string | number | boolean | {}>) => {
      setResult((prevState) => ({ ...prevState, loading: true }))
      try {
        const response = await method(args)
        if (response) {
          setResult((prevState) => ({
            ...prevState,
            // Either use response OR set to true so onSuccess callback gets invoked.
            response,
            loading: false
          }))
        }
      } catch (error) {
        setResult((prevState) => ({
          ...prevState,
          loading: false,
          error: { ...error, message: error.message }
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
