export interface UseMutationResult<U> {
  error: Error | null
  loading: boolean
  response: U | null
}

export interface UseMutation<T, U> {
  result: UseMutationResult<U>
  invoke(...params: T[]): void
  reset(): void
}
