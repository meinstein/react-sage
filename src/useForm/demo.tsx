import * as React from 'react'

import { useForm } from '.'

export const UseFormDemo: React.FC = () => {
  const { set, reset, hasErrors, data } = useForm({
    // Required - Set initial state with all expected form fields.
    initialState: { foo: 'I am foo.', bar: 0 },
    // Optional - can persist form state. Accepts same config as usePersistedState.
    persistConfig: { key: 'demo-form', version: 1, storage: localStorage },
    // Optional - add validators for fields.
    validators: { foo: (val): boolean => !val }
  })

  const { foo, bar } = data

  return (
    <>
      <div>
        <input
          type="text"
          value={foo.value}
          onChange={(event): void => {
            set({ foo: event.target.value })
          }}
        />
        <span>(required)</span>
        <pre>
          <b>Above field is dirty?</b> {foo.isDirty ? 'yes' : 'no'}
        </pre>
        <pre>
          <b>Above field has error?</b> {foo.error ? 'yes' : 'no'}
        </pre>
      </div>
      <div>
        <input
          min="0"
          max="10"
          type="number"
          value={bar.value}
          onChange={(event): void => {
            set({ bar: parseInt(event.target.value, 10) })
          }}
        />
        <span>(optional)</span>
        <pre>
          <b>Above field is dirty?</b> {bar.isDirty ? 'yes' : 'no'}
        </pre>
        <pre>
          <b>Above field has error?</b> {bar.error || 'no'}
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
