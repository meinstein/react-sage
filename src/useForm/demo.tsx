import * as React from 'react'

import { useForm } from '.'

enum FormField {
  FOO = 'foo',
  BAR = 'bar'
}

export const UseFormDemo: React.FC = () => {
  const { get, set, reset } = useForm({
    persistConfig: { name: 'demo-form', version: 1 },
    initialState: { [FormField.FOO]: 'I am foo.' }
  })

  return (
    <>
      <input
        type="text"
        value={get(FormField.FOO) as string}
        onChange={(event): void => {
          set(FormField.FOO)(event.target.value)
        }}
      />
      <input
        type="text"
        value={get(FormField.FOO) as string}
        onChange={(event): void => {
          set(FormField.FOO)(event.target.value)
        }}
      />
      <button onClick={reset}>Reset</button>
    </>
  )
}
