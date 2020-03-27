import * as React from 'react'

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

export const useForm = (initialState: FormData = {}, validators: Validators = {}): Form => {
  const [state, setState] = React.useState<FormState>({})

  React.useEffect(() => {
    // Combine all possible known keys for the form's start data.
    const startData = Object.keys({ ...initialState, ...validators }).reduce((prev, curr) => {
      return {
        ...prev,
        [curr]: {
          // Check for existence of a validator for current key and apply it to initial state.
          // If no validator for the current key, then there is no error.
          error: typeof validators[curr] === 'function' ? !validators[curr](initialState[curr]) : false,
          value: initialState[curr],
          // Whether this field has been touched yet.
          isDirty: false
        }
      }
    }, {})
    setState(startData)
    // Update start data when initialState changes!
  }, [Object.keys(initialState).length])

  const get = (key: string): string => {
    return state[key] ? state[key].value : ''
  }

  const set = (key: string) => {
    return (value: string): void => {
      setState((prevState: FormState) => ({
        ...prevState,
        [key]: {
          isDirty: true,
          error: validators[key] ? !validators[key](value) : false,
          value
        }
      }))
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

  return { get, set, hasErrors, getError, data }
}
