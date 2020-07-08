import * as React from 'react'

import { UseForm, UseFormState, UseFormOptions, UseFormData } from './types'

export function useForm<T>(options: UseFormOptions<T>): UseForm<T> {
  const { initialState, validators } = options

  const createFormState = (formData: T, prevFormState: UseFormState<T> | null, isDirty: boolean): UseFormState<T> => {
    const formState = {} as UseFormState<T>
    const fields = Object.keys(formData) as Array<keyof T>
    const nextFormState = fields.reduce((accumulatedFormState, field) => {
      const value = formData[field]
      const validator = validators?.[field]
      accumulatedFormState[field] = {
        value,
        isDirty,
        // If field has a validator, pass it the current value of said field as well as the entire previous form state.
        error: typeof validator === 'function' ? validator(value, prevFormState) : false
      }
      return accumulatedFormState
    }, formState)
    return nextFormState
  }

  const [state, setState] = React.useState<UseFormState<T>>(createFormState(initialState, null, false))

  /**
   * This setter it utilized by inputs to update its own part in the form state.
   */
  const set = (updatedFields: UseFormData<T>): void => {
    setState((prevFormState) => {
      return {
        ...prevFormState,
        ...createFormState(updatedFields, prevFormState, true)
      }
    })
  }

  /**
   * Keeps track of whether there are ANY errors present in entire form state.
   */
  const hasErrors = (Object.keys(state || {}) as Array<keyof T>).some((field) => Boolean(state[field].error))

  /**
   * Resets form state back to initialization period.
   */
  const reset = (): void => {
    setState(() => createFormState(initialState, null, false))
  }

  return { set, hasErrors, data: state, reset }
}
