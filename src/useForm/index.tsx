import * as React from 'react'

import { UseForm, UseFormState, UseFormOptions, UseFormData } from './types'
import { usePersistedState } from '../usePersistedState'

export * from './types'

export function useForm<T>(options?: UseFormOptions<T>): UseForm<T> {
  const { persistConfig, initialState, validators } = options
  const [state, setState, removePersistedState] = persistConfig
    ? usePersistedState<UseFormState<T>>(persistConfig)
    : React.useState<UseFormState<T>>()

  /**
   * Removes form metadata and simply returns { field: value }
   */
  const data = Object.keys(state || {}).reduce(
    (prevState, field) => ({
      ...prevState,
      [field]: state[field].value
    }),
    {} as UseFormData<T>
  )

  const initForm = (): void => {
    const startData = {} as UseFormState<T>
    for (const [field, value] of Object.entries({ ...initialState, ...data })) {
      startData[field] = {
        value,
        // Whether this field has been touched yet.
        isDirty: false,
        // Check for existence of a validator for current field and apply it to initial state.
        // If no validator for the current field, then there is no error.
        error: validators[field] && validators[field](value)
      }
    }
    setState(() => startData)
  }

  /**
   * This effect initializes the form.
   */
  React.useEffect(() => {
    initForm()
  }, [Object.keys(state || {}).length])

  /**
   * This getter is utilized by inputs to grab its own state from the form.
   */
  const get = (field: keyof T): T[keyof T] => {
    return state?.[field]?.value
  }

  /**
   * This setter it utilized by inputs to update its own part in the form state.
   */
  const set = (field: keyof T) => {
    return (value: T[keyof T]): void => {
      setState((prevFormState) => {
        return {
          ...prevFormState,
          [field]: {
            isDirty: true,
            error: validators?.[field] && validators[field](value),
            value
          }
        }
      })
    }
  }

  /**
   * Keeps track of whether there are ANY errors present in entire form state.
   */
  const hasErrors = Object.keys(state || {}).some((key) => !!state[key].error)

  /**
   * Can be used by an individual input to determine its own error state.
   */
  const getError = (key: keyof T): boolean | undefined | string => {
    // Only return error if field is dirty (ie, user has already given it a value)
    // Otherwise, an field with a validator will display the error message at init time.
    // Use "hasErrors" method to get holistic view of form validity.
    return state?.[key]?.isDirty && state[key].error
  }

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

  return { get, set, hasErrors, getError, data, reset }
}
