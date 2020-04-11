import { UsePersistedStateStorageOptions } from '../usePersistedState/types'

export interface Validators {
  [key: string]: (value: string | number | boolean) => boolean
}

export interface PrettyFormData {
  [key: string]: string | number | boolean
}

export interface FormValue {
  error: boolean
  isDirty: boolean
  value: string | number | boolean
}

export interface FormState {
  [key: string]: FormValue
}

export interface Form {
  get(field: string): string | number | boolean | undefined
  set(field: string): (value: string | number | boolean) => void
  hasErrors: boolean
  data: PrettyFormData
  getError(field: string): boolean
  /**
   * Resets form state back to initialization period.
   */
  reset(): void
  /**
   * Removes all form state.
   */
  clear(): void
}

export interface FormOptions {
  persistConfig?: UsePersistedStateStorageOptions
  initialState?: PrettyFormData
  validators?: Validators
}
