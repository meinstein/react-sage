import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { useForm } from '../dist'

const Form: React.FC = () => {
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

ReactDOM.render(
  <>
    <Form />
  </>,
  document.getElementById('root')
)
