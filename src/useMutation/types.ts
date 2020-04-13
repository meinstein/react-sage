export interface MutationResult<T> {
  error: Error | null
  loading: boolean
  response: T | null
}

export interface MutationResponse<T> {
  result: MutationResult<T>
  invoke: (...args: Array<string | number | boolean | {}>) => Promise<void>
  reset(): void
}
