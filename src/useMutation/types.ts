export interface MutationResult<T> {
  error: Error | null
  loading: boolean
  response: T | null
}

export interface MutationResponse<T> {
  result: MutationResult<T>
  invoke: (args: {}) => Promise<void>
  reset(): void
}
