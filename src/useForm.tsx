import { useCallback, useState } from 'react'

export namespace UseForm {
  /**
   * The internal state of the form for each field provided as initial tate.
   */
  export type State<T> = {
    [P in keyof T]: {
      error: boolean | string
      isDirty: boolean
      value: T[P]
    }
  }

  /**
   * Required to provide this hook with initialState.
   * Optionally can provide validators for some or all fields.
   */
  export interface Options<T> {
    initialState: T
    validators?: {
      [P in keyof T]?: (value: T[P], prevFormState: UseForm.State<T> | null) => boolean | string
    }
  }

  export interface Form<T> {
    set: (updatedData: Partial<T>) => void
    hasErrors: boolean
    isDirty: boolean
    data: UseForm.State<T>
    reset(): void
    getValue: (field: keyof T) => T[keyof T]
    getError: (field: keyof T) => string | boolean
    isFieldDirty: (field: keyof T) => boolean
  }
}

export function useForm<T>(options: UseForm.Options<T>): UseForm.Form<T> {
  const { initialState, validators } = options

  const _hasError = useCallback(
    (field: keyof T, value: T[keyof T], prevFormState: UseForm.State<T> | null): string | boolean => {
      const validator = validators?.[field]
      return typeof validator === 'function' ? validator(value, prevFormState) : false
    },
    [validators]
  )

  const _initFormState = useCallback(
    (formData: T): UseForm.State<T> => {
      const formState = {} as UseForm.State<T>
      const fields = Object.keys(formData) as Array<keyof T>
      const nextFormState = fields.reduce((accumulatedFormState, field) => {
        const value = formData[field]
        accumulatedFormState[field] = {
          value,
          isDirty: false,
          error: _hasError(field, value, null)
        }
        return accumulatedFormState
      }, formState)
      return nextFormState
    },
    [_hasError]
  )

  const [state, setState] = useState<UseForm.State<T>>(_initFormState(initialState))

  /**
   * This setter it utilized by inputs to update its own part in the form state.
   */
  const set = useCallback(
    (updatedData: Partial<T>): void => {
      const updatedFields = Object.keys(updatedData) as Array<keyof T>
      setState((prevFormState) => {
        const nextFormState = { ...prevFormState }
        updatedFields.forEach((field) => {
          const value = updatedData[field] as T[keyof T]
          nextFormState[field] = {
            value,
            isDirty: true,
            error: _hasError(field, value, prevFormState)
          }
        })
        return nextFormState
      })
    },
    [_hasError]
  )

  /**
   * Keeps track of whether there are ANY errors present in entire form state.
   */
  const hasErrors = (Object.keys(state || {}) as Array<keyof T>).some((field) => Boolean(state[field].error))

  /**
   * Keeps track of whether a single change has been made.
   */
  const isDirty = (Object.keys(state || {}) as Array<keyof T>).some((field) => Boolean(state[field].isDirty))

  /**
   * Get the value for a field.
   */
  const getValue = useCallback(
    (field: keyof T) => {
      return state[field].value
    },
    [state]
  )

  /**
   * Get the error for a field.
   */
  const getError = useCallback(
    (field: keyof T) => {
      return state[field].error
    },
    [state]
  )

  /**
   * Get the error for a field.
   */
  const isFieldDirty = useCallback(
    (field: keyof T) => {
      return state[field].isDirty
    },
    [state]
  )

  /**
   * Resets form state back to initialization period.
   */
  const reset = useCallback((): void => {
    setState(() => _initFormState(initialState))
  }, [_initFormState, initialState])

  return {
    set,
    hasErrors,
    data: state,
    reset,
    getValue,
    getError,
    isFieldDirty,
    isDirty
  }
}
