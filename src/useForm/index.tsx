import * as React from 'react'

import { UseForm, UseFormState, UseFormOptions, UseFormData } from './types'
import { usePersistedState } from '../usePersistedState'

export function useForm<T>(options?: UseFormOptions<T>): UseForm<T> {
  const { persistConfig, initialState, validators } = options

  const createFormState = (formData: UseFormData<T>): UseFormState<T> => {
    const formState = {} as UseFormState<T>
    for (const [field, value] of Object.entries(formData)) {
      formState[field] = {
        value,
        // Whether this field has been touched yet.
        isDirty: false,
        // Check for existence of a validator for current field and apply it to initial state.
        // If no validator for the current field, then there is no error.
        error: validators[field] && validators[field](value)
      }
    }
    return formState
  }

  const [state, setState, removePersistedState] = persistConfig
    ? usePersistedState<UseFormState<T>>({ ...persistConfig, initialState: createFormState(initialState) })
    : React.useState<UseFormState<T>>(createFormState(initialState))

  /**
   * This setter it utilized by inputs to update its own part in the form state.
   */
  const set = (updatedFields: UseFormData<T>): void => {
    setState((prevFormState) => {
      return {
        ...prevFormState,
        ...createFormState(updatedFields)
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
    if (removePersistedState) {
      removePersistedState()
    } else {
      setState(() => null)
    }
  }

  return { set, hasErrors, data: state, reset }
}
