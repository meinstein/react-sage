export interface UseBatchMutationResult<U> {
  error: Error | null
  loading: boolean
  response: U[]
}

export interface UseBatchMutation<T, U> {
  result: UseBatchMutationResult<U>
  invoke(params: T[]): void
  reset(): void
}
