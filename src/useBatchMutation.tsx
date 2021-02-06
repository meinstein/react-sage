import { useState, useCallback, useEffect } from 'react'

export namespace UseBatchMutation {
  export interface Result<U> {
    error: Error | null
    loading: boolean
    response: U[]
  }
}

const INITIAL_STATE = { response: [], loading: false, error: null }

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useBatchMutation<T, U>(
  method: (params: T) => Promise<U>,
  onSuccess?: (r: U[]) => void,
  onError?: (e: Error) => void
) {
  const [result, setResult] = useState<UseBatchMutation.Result<U>>(INITIAL_STATE)
  const [invocations, setInvocations] = useState<UseBatchMutation.Result<U>[]>([])

  const invoke = useCallback(
    async (params: T[]) => {
      // Each successive invocation is cause for resetting to initial state + loading.
      setResult(() => ({ ...INITIAL_STATE, loading: true }))

      try {
        const response = await Promise.all<U>(params.map(method))
        const result = { response, error: null, loading: false }
        setResult(() => result)
        setInvocations((prevInvocations) => prevInvocations.concat(result))
      } catch (error) {
        const result = { error, response: [], loading: false }
        setResult(() => result)
        setInvocations((prevInvocations) => prevInvocations.concat(result))
      }
    },
    [method]
  )

  useEffect(() => {
    if (onSuccess && invocations.length > 0 && result.response?.length > 0) {
      onSuccess(result.response)
    }
    // Only trigger effect when invocation list updates!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invocations.length])

  useEffect(() => {
    if (onError && invocations.length > 0 && result.error) {
      onError(result.error)
    }
    // The only reason this effect should re-run is because the invocation list changes!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invocations.length])

  return {
    result,
    invoke,
    invocations,
    reset: () => {
      setResult(INITIAL_STATE)
      setInvocations([])
    }
  }
}
