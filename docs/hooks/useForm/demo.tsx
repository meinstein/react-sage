import * as React from 'react'

import { useForm } from '../../../src'

export const UseFormDemo: React.FC = () => {
  const { set, reset, hasErrors, data, getValue, getError, isFieldDirty } = useForm({
    // Required - Set initial state with all expected form fields.
    initialState: { foo: 'I am foo.', bar: 0 },
    // Optional - add validators for fields.
    validators: { foo: (val): boolean => !val }
  })

  return (
    <>
      <div>
        <input
          type="text"
          value={getValue('foo')}
          onChange={(event): void => {
            set({ foo: event.target.value })
          }}
        />
        <span>(required)</span>
        <pre>
          <b>Above field is dirty?</b> {isFieldDirty('foo') ? 'yes' : 'no'}
        </pre>
        <pre>
          <b>Above field has error?</b> {getError('foo') ? 'yes' : 'no'}
        </pre>
      </div>
      <div>
        <input
          min="0"
          max="10"
          type="number"
          value={data.bar.value}
          onChange={(event): void => {
            set({ bar: parseInt(event.target.value, 10) })
          }}
        />
        <span>(optional)</span>
        <pre>
          <b>Above field is dirty?</b> {data.bar.isDirty ? 'yes' : 'no'}
        </pre>
        <pre>
          <b>Above field has error?</b> {data.bar.error || 'no'}
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
