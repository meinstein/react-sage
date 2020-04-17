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
  set(updatedFields: { [P in keyof T]?: T[P] }): void
  hasErrors: boolean
  data: UseFormState<T>
  reset(): void
}

export interface UseFormOptions<T> {
  initialState: T
  persistConfig?: UsePersistedStateStorageOptions
  validators?: {
    [P in keyof T]?: (value: T[P]) => boolean | undefined | string
  }
}
