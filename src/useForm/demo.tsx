import * as React from 'react'

import { useForm } from '.'

enum Field {
  FOO = 'foo',
  BAR = 'bar'
}

export const UseFormDemo: React.FC = () => {
  const { get, set, reset, getError, hasErrors } = useForm({
    // Required - Set initial state with all expected form fields.
    initialState: { [Field.FOO]: 'I am foo.', [Field.BAR]: 0 },
    // Optional - can persist form state. Accepts same config as usePersistedState.
    persistConfig: { key: 'demo-form', version: 1, storage: localStorage },
    // Optional - add validators for fields.
    validators: { [Field.FOO]: (val): boolean => !val }
  })

  return (
    <>
      <div>
        <input
          type="text"
          value={get(Field.FOO)}
          onChange={(event): void => {
            set(Field.FOO)(event.target.value)
          }}
        />
        <span>(required)</span>
        <pre>
          <b>Above field has error?</b> {getError(Field.FOO) ? 'yes' : 'no'}
        </pre>
      </div>
      <div>
        <input
          min="0"
          max="10"
          type="number"
          value={get(Field.BAR)}
          onChange={(event): void => {
            set(Field.BAR)(event.target.value)
          }}
        />
        <span>(optional)</span>
        <pre>
          <b>Above field has error?</b> {getError(Field.BAR) || 'no'}
        </pre>
      </div>
      <pre>
        <b>Does overall form have errors?</b> {hasErrors ? 'yes' : 'no'}
      </pre>
      <div>
        <button onClick={reset}>Reset Form</button>
      </div>
    </>
  )
}
