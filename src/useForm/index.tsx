import * as React from 'react'

import { Form, FormState, FormOptions, PersistFormConfig, PersistedForm } from './types'

export * from './types'

/**
 * A helper class for storing and retrieving persisted form data.
 */
class FormStorage {
  getStorageKey(name: string): string {
    return `react-sage/useForm::${name}`
  }

  getForm({ name, version }: PersistFormConfig): FormState | null {
    const key = this.getStorageKey(name)
    const persistedForm = JSON.parse(localStorage.getItem(key)) as PersistedForm | null
    if (persistedForm) {
      // We have persisted state for this version
      if (persistedForm.version === version) {
        return persistedForm.state
      }
      // Remove incorrect version
      this.clear(name)
    }
    return null
  }

  setForm({ name, version }: PersistFormConfig, state: FormState): void {
    const key = this.getStorageKey(name)
    const persistedForm = {} as PersistedForm
    persistedForm.version = version
    persistedForm.state = state
    localStorage.setItem(key, JSON.stringify(persistedForm))
  }

  clear(name: string): void {
    const key = this.getStorageKey(name)
    localStorage.removeItem(key)
  }
}

const storage = new FormStorage()

export const useForm = (options?: FormOptions): Form => {
  const { persistConfig, initialState = {}, validators = {} } = options
  const [state, setState] = React.useState<FormState>({})

  React.useEffect(() => {
    const persistedState = storage.getForm(persistConfig) || {}
    // We only care about initialState that is distinct from that which has already been persisted.
    const nonPersistedInitialStateKeys = Object.keys(initialState).filter((key) => !persistedState[key])
    // Combine all known keys when initializing form
    const startData = Object.keys(validators)
      .concat(nonPersistedInitialStateKeys)
      .reduce((prev, curr) => {
        return {
          ...prev,
          [curr]: {
            // Check for existence of a validator for current key and apply it to initial state.
            // If no validator for the current key, then there is no error.
            error: typeof validators[curr] === 'function' && !validators[curr](initialState[curr]),
            value: initialState[curr],
            // Whether this field has been touched yet.
            isDirty: false
          }
        }
      }, persistedState)
    setState(startData)
    // Update start data when initialState changes!
  }, [Object.keys(initialState).length])

  const get = (key: string): string | number | boolean => {
    return state[key]?.value
  }

  const set = (key: string) => {
    return (value: string | number | boolean): void => {
      setState((prevFormState: FormState) => {
        const nextFormState = {
          ...prevFormState,
          [key]: {
            isDirty: true,
            error: validators[key] ? !validators[key](value) : false,
            value
          }
        }
        if (persistConfig) {
          storage.setForm(persistConfig, nextFormState)
        }
        return nextFormState
      })
    }
  }

  const hasErrors = Object.keys(state)
    .map((key: string) => state[key].error)
    .some(Boolean)

  const getError = (key: string): boolean => {
    // Only return error if the field is dirty (ie, user has given an input for it)
    return state[key] ? state[key].isDirty && state[key].error : false
  }

  // Parse clean data object from state
  const data = Object.keys(state).reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: state[curr].value
    }),
    {}
  )

  const reset = (): void => {
    if (persistConfig) {
      storage.clear(persistConfig.name)
    }
    Object.keys(state).forEach((field) => set(field)(''))
  }

  return { get, set, hasErrors, getError, data, reset }
}
