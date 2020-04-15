import * as React from 'react'

import { useForm } from '.'

enum Field {
  FOO = 'foo',
  BAR = 'bar'
}

export const UseFormDemo: React.FC = () => {
  const [initialState, setInitialData] = React.useState({})

  // Simulating a situation where initialState becomes avaialable async.
  React.useEffect(() => {
    window.setTimeout(() => {
      setInitialData({ [Field.FOO]: 'I am foo.' })
    }, 1000)
  }, [])

  const { get, set, reset, getError, clear, hasErrors } = useForm({
    // Optional - can set initial state of certain form fields.
    initialState,
    // Optional - can persist form state. Accepts same config as usePersistedState.
    persistConfig: { key: 'demo-form', version: 1, storage: localStorage },
    // Optional - add validators for fields.
    validators: {
      [Field.FOO]: (val: string): boolean => !val,
      [Field.BAR]: (val: string): boolean | string => {
        return (!val || val.length < 3) && 'Must be more than 3 chars.'
      }
    }
  })

  return (
    <>
      <div>
        <input
          type="text"
          value={get(Field.FOO) as string}
          onChange={(event): void => {
            set(Field.FOO)(event.target.value)
          }}
        />
        <pre>Above field has error? {getError(Field.FOO) ? 'yes' : 'no'}</pre>
      </div>
      <div>
        <input
          type="text"
          value={get(Field.BAR) as string}
          onChange={(event): void => {
            set(Field.BAR)(event.target.value)
          }}
        />
        <pre>Above field has error? {getError(Field.BAR) || 'no'}</pre>
      </div>
      <pre>Does overall form have errors? {hasErrors ? 'yes' : 'no'}</pre>
      <div>
        <button onClick={reset}>Reset Form State</button>
        <button onClick={clear}>Clear Form State</button>
      </div>
    </>
  )
}
