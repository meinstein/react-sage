import * as React from 'react'

import { Form, FormState, FormOptions, PrettyFormData } from './types'
import { usePersistedState } from '../usePersistedState'

export * from './types'

export const useForm = (options?: FormOptions): Form => {
  const { persistConfig, initialState = {}, validators = {} } = options
  const [state, setState, removePersistedState] = persistConfig
    ? usePersistedState<FormState>(persistConfig)
    : React.useState<FormState>()

  /**
   * Removes form metadata and simply returns { field: value }
   */
  const data: PrettyFormData = Object.keys(state || {}).reduce(
    (accumulatedState, field) => ({
      ...accumulatedState,
      [field]: state[field].value
    }),
    {}
  )

  const initForm = (): void => {
    // Note: Spreading in initialState after data ensures that initialState is always king.
    const allInitialState = { ...data, ...initialState }
    const allFields = [...Object.keys(validators), ...Object.keys(allInitialState)]
    const startData = allFields.reduce((accumulatedState, field) => {
      const value = allInitialState[field] || ''
      return {
        ...accumulatedState,
        [field]: {
          // Check for existence of a validator for current field and apply it to initial state.
          // If no validator for the current field, then there is no error.
          error: typeof validators[field] === 'function' && !validators[field](value),
          value: value,
          // Whether this field has been touched yet.
          isDirty: false
        }
      }
    }, {})
    setState(() => startData)
  }

  /**
   * This effect initializes the form.
   */
  React.useEffect(() => {
    initForm()
  }, [Object.keys(initialState).length])

  /**
   * This getter is utilized by inputs to grab its own state from the form.
   */
  const get = (field: string): string | number | boolean => {
    return state?.[field]?.value || ''
  }

  /**
   * This setter it utilized by inputs to update its own part in the form state.
   */
  const set = (field: string) => {
    return (value: string | number | boolean): void => {
      setState((prevFormState: FormState) => {
        return {
          ...prevFormState,
          [field]: {
            isDirty: true,
            error: validators?.[field] ? !validators[field](value) : false,
            value
          }
        }
      })
    }
  }

  /**
   * Keeps track of whether there are ANY errors present in entire form state.
   */
  const hasErrors = Object.keys(state || {})
    .map((key: string) => state[key].error)
    .some(Boolean)

  /**
   * Can be used by an individual input to determine its own error state.
   */
  const getError = (key: string): boolean => {
    // Only return error if field is dirty (ie, user has already given it a value)
    return state[key] ? state[key].isDirty && state[key].error : false
  }

  /**
   * Resets form state back to initialization period.
   */
  const reset = (): void => {
    setState(() => ({}))
    initForm()
  }

  /**
   * Wipes out all form state.
   */
  const clear = (): void => {
    if (removePersistedState) {
      removePersistedState()
    } else {
      setState(() => ({}))
    }
  }

  return { get, set, hasErrors, getError, data, reset, clear }
}
