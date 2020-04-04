import * as React from 'react'

import { useForm } from '.'

export const UseFormDemo: React.FC = () => {
  const { get, set } = useForm()

  return (
    <input
      type="text"
      value={get('foo')}
      onChange={(event): void => {
        set('foo')(event.target.value)
      }}
    />
  )
}
