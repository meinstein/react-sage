import * as React from 'react'

import { UsePersistedStateOptions, Dispatch, SetStateAction, PersistedStateData } from './types'

export * from './types'

// function generateVersionKey(key: string): string {
//   return `${key}::version`
// }

function formatForStorage<S>(version: number, data: S): PersistedStateData<S> {
  return {
    version,
    data
  }
}

export function usePersistedState<S>({
  storage,
  key,
  initialState,
  version = 0.1
}: UsePersistedStateOptions<S>): [S, Dispatch<SetStateAction<S>>, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [state, setState] = React.useState(() => {
    try {
      const item = storage.getItem(key)
      if (!item) return initialState
      const { version: existingVersion, data } = JSON.parse(item) || {}
      const hasNewerVersion = parseFloat(existingVersion) !== version
      if (hasNewerVersion) {
        // @TODO: add migration option
        storage.removeItem(key)
        throw new Error(`Has newer version for ${key} persisted state.`)
      }
      return data
    } catch (err) {
      // If err also return initialState
      console.error(err)
      return initialState
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const set = (value: S | ((prevState: S) => S)): void => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(state) : value
      // Save state
      setState(valueToStore)
      // Save to local storage
      storage.setItem(key, JSON.stringify(formatForStorage(version, valueToStore)))
    } catch (err) {
      // A more advanced implementation would handle the err case
      console.error(err)
    }
  }

  const remove = (): void => {
    try {
      storage.removeItem(key)
      setState(initialState)
    } catch (err) {
      console.log(err)
    }
  }

  return [state, set, remove]
}
