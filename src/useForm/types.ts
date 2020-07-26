export type UseFormState<T> = {
  [P in keyof T]: {
    error: boolean | string
    isDirty: boolean
    value: T[P]
  }
}

export type UseFormData<T> = { [P in keyof T]: T[P] }

export interface UseForm<T> {
  set(updatedFields: { [P in keyof T]?: T[P] }): void
  hasErrors: boolean
  data: UseFormState<T>
  reset(): void
}

export interface UseFormOptions<T> {
  initialState: T
  validators?: {
    [P in keyof T]?: (value: T[P], prevFormState: UseFormState<T> | null) => boolean | string
  }
}
