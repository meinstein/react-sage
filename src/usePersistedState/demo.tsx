import * as React from 'react'

import { usePersistedState } from '.'

export const UsePersistedStateDemo: React.FC = () => {
  const [state, setState, remove] = usePersistedState({
    key: 'persisted-state-demo',
    version: 6,
    storage: localStorage,
    initialState: ''
  })

  return (
    <>
      <input
        type="text"
        value={state as string}
        onChange={(event): void => {
          setState(() => event.target.value)
        }}
      />
      <button onClick={remove}>Remove Persisted State</button>
    </>
  )
}
