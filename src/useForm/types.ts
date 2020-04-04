export interface Validators {
  [key: string]: (value: string) => boolean
}

export interface FormData {
  [key: string]: string
}

export interface KeyValue {
  error: boolean
  isDirty: boolean
  value: string
}

export interface FormState {
  [key: string]: KeyValue
}

export interface Form {
  get(field: string): string
  set(field: string): (value: string) => void
  hasErrors: boolean
  data: FormData
  getError(field: string): boolean
}
