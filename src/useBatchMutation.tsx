import * as React from 'react'

export namespace UseBatchMutation {
  export interface Result<U> {
    error: Error | null
    loading: boolean
    response: U[]
  }
}

const INITIAL_STATE = { response: [], loading: false, error: null }

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useBatchMutation<T, U>(method: (params: T) => Promise<U>, onSuccess?: (res: U[]) => void) {
  const [result, setResult] = React.useState<UseBatchMutation.Result<U>>(INITIAL_STATE)

  const invoke = React.useCallback(
    async (params: T[]) => {
      setResult((prevState) => ({ ...prevState, loading: true }))
      try {
        const response = await Promise.all<U>(params.map(method))
        setResult(() => ({ response, error: null, loading: false }))
      } catch (error) {
        setResult(() => ({ error, response: [], loading: false }))
      }
    },
    [method]
  )

  React.useEffect(() => {
    if (onSuccess && result.response?.length) {
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
