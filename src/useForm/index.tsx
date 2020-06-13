import * as React from 'react'

import { UseForm, UseFormState, UseFormOptions, UseFormData } from './types'

export function useForm<T>(options?: UseFormOptions<T>): UseForm<T> {
  const { initialState, validators } = options || {}

  const createFormState = (
    formData: UseFormData<T>,
    prevFormState: UseFormState<T> | null,
    isDirty: boolean
  ): UseFormState<T> => {
    const formState = {} as UseFormState<T>
    for (const [field, value] of Object.entries(formData || {})) {
      formState[field] = {
        value,
        isDirty,
        // If field has validator, pass it the current value of said field & previous form state.
        error: validators?.[field] && validators[field](value, prevFormState)
      }
    }
    return formState
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
  const hasErrors = Object.keys(state || {}).some((key) => !!state[key].error)

  /**
   * Resets form state back to initialization period.
   */
  const reset = (): void => {
    setState(() => createFormState(initialState, null, false))
  }

  return { set, hasErrors, data: state, reset }
}
