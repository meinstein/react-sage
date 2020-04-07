export interface Validators {
  [key: string]: (value: string | number | boolean) => boolean
}

export interface FormData {
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
  data: FormData
  getError(field: string): boolean
  reset(): void
}

export interface PersistFormConfig {
  /**
   * The name of the persisted form.
   */
  name: string
  /**
   * The version of the form. Subsequent versions will over-write previously stored form data.
   */
  version: number
}

export interface FormOptions {
  persistConfig?: PersistFormConfig
  initialState?: FormData
  validators?: Validators
}

export interface PersistedForm {
  version: number
  state: FormState
}
