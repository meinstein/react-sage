import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { UseFormDemo } from '../src/useForm/demo'
import { UseQueryDemo } from '../src/useQuery/demo'
import { UseMutationDemo } from '../src/useMutation/demo'

interface ContainerProps {
  title: string
}

const Container: React.FC<ContainerProps> = ({ title, children }) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

ReactDOM.render(
  <>
    <Container title="useForm">
      <UseFormDemo />
    </Container>
    <Container title="useQuery">
      <UseQueryDemo />
    </Container>
    <Container title="useMutation">
      <UseMutationDemo />
    </Container>
  </>,
  document.getElementById('root')
)
