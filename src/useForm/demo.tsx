import * as React from 'react'

import { useForm } from '.'

enum Field {
  FOO = 'foo',
  BAR = 'bar'
}

export const UseFormDemo: React.FC = () => {
  const { get, set, reset, clear, hasErrors } = useForm({
    // Optional - can persist form state. Accepts same config as usePersistedState.
    persistConfig: { key: 'demo-form', version: 6, storage: localStorage },
    // Optional - can set initial state of certain form fields.
    initialState: { [Field.FOO]: 'I am foo.' },
    // Optional - add validators for fields.
    validators: { [Field.BAR]: Boolean, [Field.FOO]: Boolean }
  })

  return (
    <>
      <input
        type="text"
        value={get(Field.FOO) as string}
        onChange={(event): void => {
          set(Field.FOO)(event.target.value)
        }}
      />
      <input
        type="text"
        value={get(Field.BAR) as string}
        onChange={(event): void => {
          set(Field.BAR)(event.target.value)
        }}
      />
      <button onClick={reset}>Reset</button>
      <button onClick={clear}>Clear</button>
      <div>{hasErrors && <b>There is an error.</b>}</div>
    </>
  )
}
