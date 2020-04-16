import { UsePersistedStateStorageOptions } from '../usePersistedState/types'

export type UseFormState<T> = {
  [P in keyof T]: {
    error: boolean | undefined | string
    isDirty: boolean
    value: T[P]
  }
}

export type UseFormData<T> = { [P in keyof T]: T[P] } | null

export interface UseForm<T> {
  get(field: keyof T): T[keyof T]
  set(field: keyof T): (val: T[keyof T]) => void
  hasErrors: boolean
  data: UseFormData<T>
  getError(field: keyof T): boolean | undefined | string
  // Resets form state back to initialization period.
  reset(): void
}

export interface UseFormOptions<T> {
  initialState: T
  persistConfig?: UsePersistedStateStorageOptions
  validators?: {
    [P in keyof T]?: (value: T[P]) => boolean | undefined | string
  }
}
